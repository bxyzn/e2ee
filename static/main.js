const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';

var socket = io.connect(protocol + document.domain + ':' + location.port);
let username = "";
let psk = "";


window.onload = function () {
    if (localStorage.getItem("username")) {
        username = localStorage.getItem("username");
        if (confirm("Hi " + username + ". Do you want to change your username?")) {
            changeUsername();
        } else {
            setUsername(username);
        }
    } else {
        changeUsername();
    }
    if (localStorage.getItem("psk")){
        psk = localStorage.getItem("psk");
        if(confirm("Do you want to change your existing PSK?")){
            changePsk();
        }
    } else {
        changePsk();
    }
}

function changePsk(){
    const v = prompt("Enter your psk:") || "";
    if(!v || v.trim() === ""){
        alert("NO PSK IS SET! Reload page to change psk...")
        return;
    }
    psk = v;
    localStorage.setItem("psk",psk);
}


function changeUsername() {
    username = prompt("Enter your username:");
    if (!username || username.trim() === "") {
        alert("Username is required! Reload the page...")
        location.reload();
        // clear saved psk when username is invalid to avoid orphaned keys
        localStorage.removeItem("psk");
        psk = "";
        return;
    }
    setUsername(username.trim());
}

function setUsername(name) {
    localStorage.setItem("username", name);
    var el = document.getElementById("username");
    if (el) {
        el.innerHTML = "@" + name;
    }
}

async function sendMessage() {
    var msg = document.getElementById('m').value;

    if (msg) {
        var payload = {
            username: username,
            msg: msg,
        };

        try {
            const encrypted = await window.encryptData(psk, payload);
            socket.emit('message', encrypted);
            document.getElementById('m').value = '';
        } catch (err) {
            console.error('Encryption failed', err);
            alert('Failed to encrypt message. Check console for details.');
        }
    }
}


socket.on('message', async function (payload) {
    var item = document.createElement('li');
    try {
        const decrypted = await window.decryptData(psk, payload);
        let uname = (decrypted && decrypted.username) ? decrypted.username : 'unknown';
        let msg = (decrypted && decrypted.msg) ? decrypted.msg : '';
        item.textContent = uname + " : " + msg;
    } catch (err) {
        // if decryption fails, show raw payload so user can see something
        console.warn('Decryption failed for incoming message', err);
        item.textContent = 'Message (encrypted): ' + payload;
    }

    var list = document.getElementById('messages');
    if (list) {
        list.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    }
});
