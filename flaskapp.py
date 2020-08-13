from flask import Flask, request, render_template, jsonify

import json
import os
import csv
import re
import sys

import spacy
from spacy import displacy
from spacy.pipeline import EntityRecognizer
from nltk.corpus import wordnet 
from gensim.test.utils import datapath
from gensim.models import KeyedVectors

import urllib
#from owlready2 import *
from rdflib import Graph
import xml.etree.ElementTree as ET

from SPARQLWrapper import SPARQLWrapper, JSON

app = Flask(__name__)
@app.route('/')
def hello_world():
  sys.stderr.write(sys.prefix)
  #sys.stderr.write('log mgs')
  return 'Hello from Flask!'
if __name__ == '__main__':
  app.run()