# -*- coding: utf-8 -*-
from flask import Flask, request, render_template, jsonify

import json
import os
import csv
import re
import sys

import spacy
from spacy import displacy
from spacy.pipeline import EntityRecognizer
# from nltk.corpus import wordnet # too big to load in AWS
# from gensim.test.utils import datapath # too big to load in AWS
# from gensim.models import KeyedVectors # too big to load in AWS

import urllib
#from owlready2 import *
from rdflib import Graph
import xml.etree.ElementTree as ET

from SPARQLWrapper import SPARQLWrapper, JSON
#from allennlp.common.testing import AllenNlpTestCase
#from allennlp.predictors.predictor import Predictor

# Global variables
nlp = None # spacy NLP library
csoGraph = None # CSO ontology
word_vectors = None # word vectors from wordNet
csoDict = None # the dictionary of all cso entities

def LoadResources():
    global nlp, csoGraph, word_vectors, csoDict

    # load Spacy NLP dictionary
    # print("Loading spacy dictionary...")
    sys.stderr.write('Loading spacy dictionary...')

    nlp = spacy.load('en_core_web_sm')
    # print("Spacy dictionary is loaded successfully!\n")
    sys.stderr.write('Spacy dictionary is loaded successfully!')

    # print("Loading ontology...")
    sys.stderr.write('Loading ontology...')
    csoGraph = Graph()
    path = os.path.join(app.static_folder, 'source/CSO.3.1.owl')
    csoGraph.parse(path, format="xml")
    # print("Ontology is loaded successfully!\n")
    sys.stderr.write('Ontology is loaded successfully!')

    # print("Loading conceptNet...")
    sys.stderr.write('Loading conceptNet...')
    #word_vectors = KeyedVectors.load_word2vec_format("numberbatch-en.txt", binary=False)  # C text format
    # print("ConceptNet is loaded successfully!\n")
    sys.stderr.write('ConceptNet is loaded successfully!\n')

    # print("Loading CSO dictionary...")
    sys.stderr.write('Loading CSO dictionary...')
    csoDict = dict()
    path = os.path.join(app.static_folder, 'source/cso_dict.csv')
    with open(path, 'r') as csvfile:
        dictReader = csv.reader(csvfile, delimiter=',')
        for row in dictReader:
            csoDict[row[0]] = row[1]
    # print("CSO dictionary is loaded successfully!\n")
    sys.stderr.write('CSO dictionary is loaded successfully!\n')

# pre-processing
def PreProcess(senSet):
    #remove content between [ ]
    print("Pre-processing...")
    for index in range(len(senSet)):
        while senSet[index].find('[')>=0:
            i_start = senSet[index].find('[')
            i_end = senSet[index].find(']')
            s = senSet[index][i_start:i_end+2]
            senSet[index] = senSet[index].replace(s, "")


def QueryURI(keywords, index=-2):
    localSite = 'http://localhost:1111/api/search/KeywordSearch?'
    onlineSite = 'http://lookup.dbpedia.org/api/search/KeywordSearch?'
    prefix = "{http://lookup.dbpedia.org/}"
    
    keywords = keywords.replace(' ', "%20")
    request = onlineSite + \
    'QueryClass='   + ''  + \
    '&MaxHits='     + '5' + \
    '&QueryString=' + keywords
    response = str(urllib.request.urlopen(request).read(), 'utf-8')

    root = ET.fromstring(response)
    result = root.findall(prefix + "Result")
    uriList = []
    
    if len(result)>0:
        for entity in result:
            uriList.append(entity.find(prefix + "URI").text)
        return uriList
    else:
        #print("Sorry, we find nothing for this stuff :(\n")
        return None
    
    '''if len(result)>0:
        selected = -1
        count = 0
        for name in result:
            print(str(count) + ": " + name.find(prefix + "Label").text)
            count += 1
        # for some default input during debugging
        if index<-1:
            index = int(input("Which one is closer to what you mean? (type \"-1\" if nothing seems correct) "))
        if index >= 0:
            selected = "<" + result[index].find(prefix + "URI").text + ">"
        else:
            selected = None
        return selected.replace("/resource", "/ontology")
    else:
        print("Sorry, we find nothing for this stuff :(\n")
        return None'''

            
# get ontology hierarchy for every keyword and append the knowledge tree
def AppendTree(entityList, treeDict):
    for URI in entityList:
        hierarchy = QueryHierarchy(URI)
        #print(hierarchy)
        
        curDict = treeDict
        for curKey in hierarchy:
            if curKey in curDict:
                curDict = curDict[curKey]
            else:
                curDict[curKey] = dict()
                curDict = curDict[curKey]
    
# A recursive helper function to traverse treeDict and format it to json
def PreorderFormat(curDict):
    if len(curDict) == 0:
        return
    
    childList = []
    for key in curDict:
        children = PreorderFormat(curDict[key])
        if children:
            childList.append({
                "name": key,
                "uncertainty": 3,
                "children": children
            })
        else:
            childList.append({
                "name": key,
                "uncertainty": 3,
                "size": 10
            })
    return childList
    
        
def FormatToJson(treeDict):
    resultList = PreorderFormat(treeDict)
    finalResult = None
    
    # only show the computer science part (remove math ...)
    for result in resultList:
        if "computer_science" in result["name"]:
            finalResult = result
    
    # show all part and add a root node
    '''finalResult = {
        "name": "GroundRoot",
        "uncertainty": 3,
        "children": resultList
    }'''
    
    return finalResult

# directly construct the final hierarchical tree according to the keyword 
def ConstructTree(entityDict, treeList):
    for entityURI in entityDict: # uri is the key of the dict
        hierarchy = QueryHierarchy(entityURI)
        curList = treeList

        for curURI in hierarchy:
            index = FindIndex(curURI, curList)
            if index > -1:
                curList = curList[index]["children"]
            else:
                if curURI == hierarchy[-1]:
                    entityDict[curURI]["strPath"] = '&-&'.join(hierarchy)
                    curList.append(entityDict[curURI])
                else:
                    curList.append({
                        "name": curURI,
                        "uncertainty": 3,
                        "children": []
                    })
                    curList = curList[len(curList)-1]["children"]
                
def FindIndex(URI, infoList):
    index = 0
    while index < len(infoList):
        if infoList[index]["name"] == URI:
            break
        index += 1
            
    if index < len(infoList):
        return index
    else:
        return -1
            
    
# extract one triple from given sentence
def RunNER(sen):
    # initialize the named entity list
    entityList = []
    
    # parse sentence
    doc = nlp(str(sen))

    #ents = [(e.text, e.start_char, e.end_char, e.label_) for e in doc.ents]
    chunks = []
    for chunk in doc.noun_chunks:
        if "subj" in chunk.root.dep_ or "obj" in chunk.root.dep_:
            # test whether current chunk is or contains stop words
            result = ''
            doc_phrase = nlp(chunk.text)
            for token in doc_phrase:
                #print(token.text, token.is_stop, token.lemma_)
                if not token.is_stop and token.lemma_ != "-PRON-":
                # exclude stop words and personal pronouns (whose lemma_ is "-PRON-")
                    result = result + token.text + ' '
            
            if result != '':
                chunks.append(result[:-1])
    
    return chunks

# given a URI in DBPedia, query corresponding URI in CSO
def DBPD2CSO(dbpediaURI):
    csoURIList = []
    
    results = csoGraph.query("""
        SELECT ?csoURI
        WHERE { ?csoURI <http://www.w3.org/2002/07/owl#sameAs> <""" + dbpediaURI + """>. }
    """).serialize(format="json")
    results = json.loads(results)

    for result in results["results"]["bindings"]:
        csoURIList.append('<' + result["csoURI"]["value"] + '>')
        
    return csoURIList

# given a list of candidate uri, select the best one
def SelectURI(source, candiList):
    maxSim = 0
    maxURI = candiList[0]
    
    # use conceptNet to select the url
    '''for candidate in candiList:
        print(source.replace(' ', '_'))
        print(candidate[candidate.rfind("/")+1:-1])
        try:
            similarity = word_vectors.similarity(source.replace(" ", "_"), candidate[candidate.rfind("/")+1:-1])
            print(similarity)
            if similarity > maxSim:
                maxSim = similarity
                maxURI = candidate
                print(candidate)
                print(similarity)
        except:
            print("can't find "+candidate[candidate.rfind("/")+1:-1])
    '''
    # use wordNet to select the url
    for candidate in candiList:
        #print(source.replace(' ', '_'))
        #print(candidate[candidate.rfind("/")+1:-1])
        w1 = wordnet.synsets(source.replace(' ', '_'))
        w2 = wordnet.synsets(candidate[candidate.rfind("/")+1:-1])
        if len(w1) and len(w2):
            similarity = w1[0].wup_similarity(w2[0])
            #print(similarity)
            if similarity > maxSim:
                maxSim = similarity
                maxURI = candidate
                #print(candidate)
                #print(similarity)
                
    return maxURI

# given a URI, query the ontology iteratively to get its path to root
def QueryHierarchy(URI):
    #print("\n" + URI)
    path = []
    path.insert(0, URI)
    
    curURI = URI
    endFlag = False # to mark whether a dbo:entity is found in current level
    
    while not endFlag:
        endFlag = True
        
        qSelect = """
            SELECT ?parentURI
            WHERE { ?parentURI <http://cso.kmi.open.ac.uk/schema/cso#superTopicOf> """ + curURI + """. }
        """

        results = csoGraph.query(qSelect).serialize(format="json")
        results = json.loads(results)
        
        for result in results["results"]["bindings"]:
            resultURI = '<' + result["parentURI"]["value"] + '>'
            #print(resultURI)
            curURI = resultURI
            path.insert(0, resultURI)
            endFlag = False
            break
     
    # insert the common root node to current path
    # path.insert(0, '<https://cso.kmi.open.ac.uk/topics/computer_science>')
    #print(path)
    return path

def SortNeighbors(e):
    return e["count"]

# given a URI, query all entities connected to current one
def QueryNeighbors(URI):
    neighborDict = {}
    
    # query entities connected to current URI as object
    qSelectObject = """
        SELECT ?p ?o
        WHERE {<""" + URI + """> ?p ?o. }
    """

    results = csoGraph.query(qSelectObject).serialize(format="json")
    results = json.loads(results)

    for result in results["results"]["bindings"]:
        neighborURI = result["o"]["value"]
        if "cso.kmi.open.ac.uk/topics" in neighborURI and neighborURI != URI:
            if neighborURI in neighborDict:
                neighborDict[neighborURI]["count"] += 1
            else:
                neighborDict[neighborURI] = {
                    "name": neighborURI,
                    "predicate": result["p"]["value"],
                    "part": "o",
                    "count": 1
                }
                
    # query entities connected to current URI as subject
    qSelectSubject = """
        SELECT ?s ?p
        WHERE { ?s ?p <""" + URI + """>. }
    """

    results = csoGraph.query(qSelectSubject).serialize(format="json")
    results = json.loads(results)

    for result in results["results"]["bindings"]:
        neighborURI = result["s"]["value"]
        if "cso.kmi.open.ac.uk/topics" in neighborURI and neighborURI != URI:
            if neighborURI in neighborDict:
                neighborDict[neighborURI]["count"] += 1
            else:
                neighborDict[neighborURI] = {
                    "name": neighborURI,
                    "predicate": result["p"]["value"],
                    "part": "s",
                    "count": 1
                }
    
    neighborList = list(neighborDict.values())
    neighborList.sort(reverse=True, key=SortNeighbors)
    return neighborList[:10]

# given a URI, return corresponding DBPedia link if available
def QueryDBPedia(URI):
    global csoGraph
    sameAsURIs = ["http://www.w3.org/2002/07/owl#sameAs", "http://www.w3.org/2002/07/owl#sameAs"]
    
    for sameAsURI in sameAsURIs:
        qSelect = """
            SELECT ?link
            WHERE {<""" + URI + """> <"""+ sameAsURI +"""> ?link. }
        """

        results = csoGraph.query(qSelect).serialize(format="json")
        results = json.loads(results)

        wikiURI = None
        wikiInfo = None
        for result in results["results"]["bindings"]:
            if "dbpedia.org" in result["link"]["value"]:
                wikiURI = result["link"]["value"]

        if wikiURI != None:
            break
    
    if wikiURI != None:
        sparql = SPARQLWrapper("http://dbpedia.org/sparql")
        sparql.setQuery("""
            SELECT ?abstract ?thumbnail
            WHERE {""" +
                """OPTIONAL{<""" + wikiURI + """> dbo:abstract ?abstract .}""" +
                """OPTIONAL{<""" + wikiURI + """> dbo:thumbnail ?thumbnail.}
            FILTER (lang(?abstract) = 'en')
            }
        """)
        sparql.setReturnFormat(JSON)
        results = sparql.query().convert()

        for result in results["results"]["bindings"]:
            wikiInfo = {
                "wiki": wikiURI
            }
            if "abstract" in result:
                wikiInfo["abstract"] = result["abstract"]["value"]
            if "thumbnail" in result:
                wikiInfo["thumbnail"] = result["thumbnail"]["value"]
    return wikiInfo

def ProcessSen(senSet): 
    # pre-processing
    #PreProcess(senSet)

    cacheDict = dict()

    # parse and query each sentence
    entityDict = dict()
    URIList = []
    #for index in range(0, 3):
    for index in range(len(senSet)):
        #index = 26
        sampleSentence = "We examine how animating a viewpoint change in a spatial \
        information system affects a user’s ability to build a mental \
        map of the information in the space. We found that \
        real-time application improves users' ability to reconstruct the \
        information space, with no penalty on task performance \
        time. We believe that this study provides strong evidence \
        for adding speech recognition software in many applications with \
        fixed spatial data where the user navigates around the data \
        space."
        #sampleSentence = "We believe that this study provides strong evidence \
        #for adding animated transitions in many applications with \
        #fixed spatial data where the user navigates around the data \
        #space."

        # extract named entities from current sentence
        print('\n' + str(index) + '. Original Sentence:\n' + senSet[index])
        #nameEntityList = RunNER(sampleSentence)
        nameEntityList = RunNER(senSet[index])
        #print(nameEntityList)

        # look up the URI for the entities
        for entity in nameEntityList:
            #print("\nFor \"" + entity + "\":")
            entityURI = None
            csoURIList = []
            try:
                if entity in cacheDict:
                    entityURI = cacheDict[entity]
                    '''if entityURI != None: 
                        print("You mentioned", entity, "before. Do you mean", entityURI, "?")
                    else:
                        print("You mentioned", entity, "before, but we can't find anything about it.")'''
                        #RIList.append(entityURI)

                elif entity.replace(' - ', '-').replace(' ', '_') in csoDict:
                    #print("Find " + entity + " directly in CSO dictionary!")
                    entityURI = csoDict[entity.replace(' - ', '-').replace(' ', '_')]

                else:
                    dbpdURIList = QueryURI(entity.replace(' - ', '-'))
                    #print(dbpdURIList)
                    if dbpdURIList != None:
                        #URIList.append(dbpdURIList)
                        for dbpdURI in dbpdURIList:
                            csoURIList.extend(DBPD2CSO(dbpdURI))
                        if len(csoURIList):
                            entityURI = SelectURI(entity, csoURIList)
                            
                # query further information and wrap them in entityInfo
                if entityURI != None:
                    #URIList.append(entityURI)
                    #print(entityURI)
                    if entityURI in entityDict:
                        entityDict[entityURI]["size"] += 1
                        entityDict[entityURI]["sentence"].append(senSet[index])
                    else:
                        entityInfo = {
                            "name": entityURI,
                            "origin": entity,
                            "strPath": "",
                            "uncertainty": 3,
                            "sentence": [senSet[index]],
                            "size": 1,
                            "children":[]
                        }
                        if len(csoURIList)>0:
                            entityInfo["candidates"] = csoURIList
                        #print(entityInfo)
                        #hierarchy = QueryHierarchy(entityURI)
                        #for curKey in hierarchy:
                        #    entityInfo["strPath"] = entityInfo["strPath"]  + curKey + "&-&"
                        #entityInfo["strPath"] = entityInfo["strPath"][:-3]
                        entityDict[entityURI] = entityInfo 
                    
            except Exception as e: 
                print("Can't find related url for " + entity)
                print(e)

    #print(entityDict)

    #entityDict = {'<https://cso.kmi.open.ac.uk/topics/fuzzy_cognitive_maps>': {'uri': '<https://cso.kmi.open.ac.uk/topics/fuzzy_cognitive_maps>', 'strPath': '', 'sentence': 'We examine how animating a viewpoint change in a spatial information system affects a user’s ability to build a mental map of the information in the space', 'size': 1, 'candidate': [], 'children': []}, '<https://cso.kmi.open.ac.uk/topics/database>': {'uri': '<https://cso.kmi.open.ac.uk/topics/database>', 'strPath': '', 'sentence': 'We examine how animating a viewpoint change in a spatial information system affects a user’s ability to build a mental map of the information in the space', 'size': 1, 'candidate': [], 'children': []}, '<https://cso.kmi.open.ac.uk/topics/satellite_systems>': {'uri': '<https://cso.kmi.open.ac.uk/topics/satellite_systems>', 'strPath': '', 'sentence': 'We examine how animating a viewpoint change in a spatial information system affects a user’s ability to build a mental map of the information in the space', 'size': 1, 'candidate': [], 'children': []}, '<https://cso.kmi.open.ac.uk/topics/software>': {'uri': '<https://cso.kmi.open.ac.uk/topics/software>', 'strPath': '', 'sentence': 'We believe that this study provides strong evidence for adding animated transitions in many applications with fixed spatial data where the user navigates around the data space', 'size': 1, 'candidate': [], 'children': []}, '<https://cso.kmi.open.ac.uk/topics/graphical_user_interfaces>': {'uri': '<https://cso.kmi.open.ac.uk/topics/graphical_user_interfaces>', 'strPath': '', 'sentence': 'We believe that this study provides strong evidence for adding animated transitions in many applications with fixed spatial data where the user navigates around the data space', 'size': 2, 'candidate': [], 'children': []}, '<https://cso.kmi.open.ac.uk/topics/programming_models>': {'uri': '<https://cso.kmi.open.ac.uk/topics/programming_models>', 'strPath': '', 'sentence': '\nDuring the past decade, researchers have explored the use of animation in many aspects of user interfaces', 'size': 1, 'candidate': [], 'children': []}, '<https://cso.kmi.open.ac.uk/topics/energy_savings>': {'uri': '<https://cso.kmi.open.ac.uk/topics/energy_savings>', 'strPath': '', 'sentence': '\nDuring the past decade, researchers have explored the use of animation in many aspects of user interfaces', 'size': 1, 'candidate': [], 'children': []}, '<https://cso.kmi.open.ac.uk/topics/ontologies>': {'uri': '<https://cso.kmi.open.ac.uk/topics/ontologies>', 'strPath': '', 'sentence': '\nDuring the past decade, researchers have explored the use of animation in many aspects of user interfaces', 'size': 1, 'candidate': [], 'children': []}, '<https://cso.kmi.open.ac.uk/topics/user_interfaces>': {'uri': '<https://cso.kmi.open.ac.uk/topics/user_interfaces>', 'strPath': '', 'sentence': '\nDuring the past decade, researchers have explored the use of animation in many aspects of user interfaces', 'size': 1, 'candidate': [], 'children': []}, '<https://cso.kmi.open.ac.uk/topics/iaas>': {'uri': '<https://cso.kmi.open.ac.uk/topics/iaas>', 'strPath': '', 'sentence': 'Users commonly report that they prefer animation, and yet there has been very little research that attempts to understand how animation affects users’ performance', 'size': 1, 'candidate': [], 'children': []}, '<https://cso.kmi.open.ac.uk/topics/cognitive_process>': {'uri': '<https://cso.kmi.open.ac.uk/topics/cognitive_process>', 'strPath': '', 'sentence': 'Users commonly report that they prefer animation, and yet there has been very little research that attempts to understand how animation affects users’ performance', 'size': 1, 'candidate': [], 'children': []}}

    # output the concatenated hierarchy
    treeList = []
    if len(entityDict)>0:
        ConstructTree(entityDict, treeList)

    #treeJson = FormatToJson(treeDict)
    #print(treeJson)

    #print(treeList)

    csIndex = FindIndex('<https://cso.kmi.open.ac.uk/topics/computer_science>', treeList)
    if (csIndex >= 0):
        #return json.dumps(treeList[csIndex], indent = 2)
        return treeList[csIndex]
    else:
        return None

###########################################################################
#             Interfaces that are accessible from front-end               #
###########################################################################

# test function with local loaded data
def LoadGraphData(fileName):
    data = ""
    path1 = os.path.join(app.static_folder, 'data', fileName) # for files ouside
    path2 = os.path.join(app.static_folder, 'data', fileName[:-7], fileName) # for files in the folder
    try:
        with open(path1) as jsonfile:
            data = json.load(jsonfile)
    except IOError:
        try:
            with open(path2) as jsonfile:
                data = json.load(jsonfile)
        except IOError: 
            print("Could not read file:", fileName)

    return json.dumps(data, indent = 2)

# load text data and return as sentence set
def LoadTextData(fileName):
    # load txt data
    path = os.path.join(app.static_folder, 'data', fileName)
    file = open(path, "r")
    #file = open("newdataset_formatted.csv", "r")
    text = file.read()
    text = text.replace('  ', ' ')
    senSet = re.split(r' *[\.\?!][\'"\)\]]* *', text)
    file.close()
    print("Total sentences: " + str(len(senSet)))
    return senSet

# given a URI (without "<>"")
# query neighbors, dbpedia link, abstract and thumbnail
def QueryEntityData(URI):
    wikiInfo = QueryDBPedia(URI)
    neighborList = QueryNeighbors(URI)

    info = {}

    if wikiInfo != None:
        info = wikiInfo
    info["neighbor"] = neighborList
    return info

app = Flask(__name__)

@app.route('/')
def my_form():
    return render_template('index.html')


@app.route('/loadGraph', methods=['POST',"GET"])
def LoadGraph():
    fileName = request.form.get("filename")
    return LoadGraphData(fileName)

@app.route('/loadText', methods=['POST',"GET"])
def LoadText():
    fileName = request.form.get("filename")
    print("Filename: " + fileName)
    senSet = LoadTextData(fileName)
    
    result = {
        "sentences": senSet,
        #"hierarchy": ProcessSen(senSet) # run the backend algorithms
        "hierarchy": []
    }

    return json.dumps(result, indent = 2)

@app.route('/queryEntity', methods=['POST',"GET"])
def QueryEntity():
    uri = request.form.get("uri")
    if '<' in uri:
        uri = uri.replace('<', '')
    if '>' in uri:
        uri = uri.replace('>', '')
    return json.dumps(QueryEntityData(uri), indent = 2)

if __name__ == '__main__':
    sys.stderr.write(sys.prefix)
    LoadResources()
    app.run()