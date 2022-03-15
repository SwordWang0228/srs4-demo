const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/libopus.wasm', (req, res) => {
    res.sendFile(__dirname + '/libopus.wasm');
});
app.get('/libopus.wasm.js', (req, res) => {
    res.sendFile(__dirname + '/libopus.wasm.js');
});

//add for new try
app.get('/AudioControllerApi.js', (req, res) => {
    res.sendFile(__dirname + '/js/AudioControllerApi.js');
});

app.get('/cy.js', (req, res) => {
    res.sendFile(__dirname + '/js/cy.js');
});

app.get('/libopus.js', (req, res) => {
    res.sendFile(__dirname + '/js/libopus.js');
});

app.get('/opus.js', (req, res) => {
    res.sendFile(__dirname + '/js/opus.js');
});

app.get('/xaudio.js', (req, res) => {
    res.sendFile(__dirname + '/js/xaudio.js');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    //console.log(__dirname);
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        socket.broadcast.emit('chat message',msg);
    });
    socket.on('audio', (msg) => {
        //console.log('recieve a audio message!');
        
        socket.broadcast.emit('audio',msg);
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});