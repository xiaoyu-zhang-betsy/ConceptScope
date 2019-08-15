from flask import Flask, request, render_template, jsonify
import random as r
import math as m

app = Flask(__name__)
def Montecarlo(iterate):
    # Number of darts that land inside.
    inside = 0
    # Total number of darts to throw.
    total = iterate

    # Iterate for the number of darts.
    for i in range(0, total):
    # Generate random x, y in [0, 1].
        x2 = r.random()**2
        y2 = r.random()**2
    # Increment if inside unit circle.
        if m.sqrt(x2 + y2) < 1.0:
            inside += 1

     # inside / total = pi / 4
    pi = (float(inside) / total) * 4

    # It works!
    return str(pi)

@app.route('/')
def my_form():
    return render_template('index.html')


@app.route('/request', methods=['POST',"GET"])
def my_form_post():

    text = request.form.get("str")
    iterate = int(text)
    processed_text = Montecarlo(iterate)
    return processed_text


if __name__ == '__main__':
    app.run()
