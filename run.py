from flask import Flask, request, render_template, jsonify
import random as r
import math as m

import json
import os

# test function with local loaded data
def LoadLocalData(fileName):
    path = os.path.join(app.static_folder, 'data', fileName)
    with open(path) as jsonfile:
        data = json.load(jsonfile)
    return json.dumps(data)

app = Flask(__name__)

@app.route('/')
def my_form():
    return render_template('index.html')


@app.route('/request', methods=['POST',"GET"])
def my_form_post():
    fileName = request.form.get("filename")
    print(fileName)
    return LoadLocalData(fileName)


if __name__ == '__main__':
    app.run()
