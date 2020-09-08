# DocViewer
A client-server application for bubble treemap

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
Start the server
-----
* Move to the root directory (where `server.py` is)

* Start the server

    `python3 server.py`

* Copy the local address provided by the server (http://0.0.0.0:5000/ by default)

#### 4) Visit the local address with web browser (tested with Chrome)