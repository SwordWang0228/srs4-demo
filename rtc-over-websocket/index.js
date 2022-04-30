
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const DelayDetection = require(__dirname + "/DelayDetection.js");
const SocketHandler = require(__dirname + "/js/SocketHandler.js");

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/libopus.wasm', (req, res) => {
    res.sendFile(__dirname + '/js/libopus.wasm');
});
app.get('/libopus.wasm.js', (req, res) => {
    res.sendFile(__dirname + '/js/libopus.wasm.js');
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

app.get('/DelayDetection.js', (req, res) => {
    res.sendFile(__dirname + '/js/DelayDetection.js');
});

app.get('/sonic.js', (req, res) => {
    res.sendFile(__dirname + '/js/sonic.js');
});

app.get('/JitterBuffer.js', (req, res) => {
    res.sendFile(__dirname + '/js/JitterBuffer.js');
});

app.get('/mozjpeg_enc.js', (req, res) => {
    res.sendFile(__dirname + '/js/mozjpeg_enc.js');
});

app.get('/mozjpeg_enc.wasm', (req, res) => {
    res.sendFile(__dirname + '/js/mozjpeg_enc.wasm');
});


const userToSocketId = {};
var handlermap = new Map();

function getTimestamp() {
    return Date.now();
}

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
    let delayDet = new DelayDetection();
    let handler = new SocketHandler(socket,delayDet,handlermap);

    handlermap.set(socket.id,handler);
    handler.init();
 
    

    // const socketId = socket.id;
    // let userName = null;
    

    // delayDet = new DelayDetection();

    // function sendMessageToOthers(eventName, msg) {
    //     // 发消息给其它端，并带上服务端时间
    //     msg.serverTime = new Date().getTime();
    //     msg.fromUserName = userName;
    //     // for (const tmpUserName in userToSocketId) {
    //     //     const tmpSocketId = userToSocketId[tmpUserName];
    //     //     if (socketId !== tmpSocketId) {
    //     //         socket.to(tmpSocketId).emit(eventName, msg);
    //     //     }
    //     // } 
    //     socket.broadcast.emit(eventName, msg);
    // }

    //console.log(__dirname);
    // socket.on('disconnect', () => {
    //     delete userToSocketId.userName
    //     console.log('user disconnected', socketId);
    // });

    // socket.on('login', (body) => {
    //     userToSocketId[body.userName] = socketId;
    //     userName = body.userName;
    //     console.log('user login', userName);
    // })

    // socket.on('audio', (msg) => {
    //     sendMessageToOthers('audio', msg);
    // });

    // socket.on('SyncReqest', (msg) => {

    //     delayDet.updateTimestamp(msg.sts,undefined, getTimestamp());

    //     let syncRespone = {
    //         sts:getTimestamp()
    //     };
    //     sendMessageToOthers('SyncResponse', syncRespone);

    // });

    // socket.on('SyncResponse', (msg) => {
    //     sendMessageToOthers('SyncResponse', msg);
    // });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});