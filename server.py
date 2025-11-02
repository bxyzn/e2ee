from flask import Flask, render_template
from flask_socketio import SocketIO, send

app = Flask(__name__)

app.config['SECRET_KEY'] = '37ffe20e4f80778c099183129d50f1be434cd5d322407c0b1e19934052f6094c' 
socketio = SocketIO(app)


@app.route('/')
def index():
    return render_template('index.html')


@socketio.on('message')
def handle_message(msg):
    send(msg, broadcast=True)


if __name__ == '__main__':
    socketio.run(app, debug=True)