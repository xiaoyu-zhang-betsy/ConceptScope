from flask import Flask
import sys
import spacy

app = Flask(__name__)
@app.route('/')
def hello_world():
  sys.stderr.write(sys.prefix)
  #sys.stderr.write('log mgs')
  return 'Hello from Flask!'
if __name__ == '__main__':
  app.run()