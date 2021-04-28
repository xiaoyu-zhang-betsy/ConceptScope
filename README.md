# ConceptScope
* ConceptScope is a client-server application for viewing and comparing documents and their underlying concepts in the context of a domain ontology.

* ConceptScope is from: Zhang, Chandrasegaran and Ma "ConceptScope: Organizing and Visualizing Knowledge in Documents based on Domain Ontology", arXiv:2003.05108, 2020.
******

Requirements
-----
* Python3
* Note: Tested on Ubuntu 18.04.2 LTS.
******

Setup
-----

#### 1) Initialize Virtual Enviroment (Optional)
* Tested with virtualenv (https://virtualenv.pypa.io/en/latest/index.html)

#### 2) Installation of Python Dependencies
* Stay at the root directory (where `server.py` is)

* Install all Python dependencies (tested with python3.6.0)

    `pip3 install .`

#### 3) Installation of Spacy Dictionary
* Stay at the root directory (where `server.py` is)

* Install the dictionary

    `python3 -m spacy download en_core_web_sm`

******
Usage
-----
* Move to the root directory (where `server.py` is)

* Start the server

    `python3 server.py`

* Copy the local address provided by the server (http://0.0.0.0:5000/ by default)

#### 4) Visit the local address with web browser (tested with Chrome)

******
How to cite
-----
Please cite:    
* ConceptScope is from: Zhang, Chandrasegaran and Ma "ConceptScope: Organizing and Visualizing Knowledge in Documents based on Domain Ontology", arXiv:2003.05108, 2020.
