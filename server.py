from flask import Flask, render_template, request
from flask_socketio import SocketIO, send, emit
app = Flask(__name__)


app.config['SECRET_KEY'] = '37ffe20e4f80778c099183129d50f1be434cd5d322407c0b1e19934052f6094c' 
socketio = SocketIO(app, cors_allowed_origins="*")


msg_history = []

@app.route('/')
def index():
    return render_template('index.html')


@socketio.on('message')
def handle_message(msg):
    msg_history.append(msg)
    send(msg, broadcast=True)

@socketio.on('newuser')
def get_history():
    emit('history', msg_history, room=request.sid)


@socketio.on('getcommand')
def get_command(token):
    # only allow clearing if the provided token matches the server secret
    try:
        if token and str(token) == app.config.get('SECRET_KEY'):
            msg_history.clear()
            # notify all connected clients to clear their displayed history
            emit('history_cleared', broadcast=True)
            # acknowledge to the requester
            emit('clear_history_ack', {'status': 'ok'}, room=request.sid)
        else:
            emit('clear_history_ack', {'status': 'forbidden'}, room=request.sid)
    except Exception:
        emit('clear_history_ack', {'status': 'error'}, room=request.sid)

if __name__ == '__main__':
    socketio.run(app, debug=True, host="0.0.0.0")
