//websocket服务

var fs = require("fs");
var WebSocketServer = require('ws').Server;

var wsPort = '8181';
var masterId;
var listeners = {};

// var wss = new WebSocketServer({ server:httpsServer});
wss = new WebSocketServer({
  port: wsPort,
  host: '0.0.0.0'//必须加，避免被识别成ipv6
});

wss.on('connection', function (ws, req) {
  console.log('connection');
  var connectionId = req.headers['sec-websocket-key'];
  var isMaster = false;

  if (!masterId) {
    masterId = connectionId;
    isMaster = true;
    ws.on('message', function (message) {
      for (var cid in listeners) {
        listeners[cid].send(message, {
          binary: true
        }, function (err) {
          if (err) {
            console.log('Error: ', err);
          }
        });
      }
    });
    console.log('Speaker connected');
  } else {
    listeners[connectionId] = ws;
    isMaster = false;
    console.log('Listener connected');
  }

  ws.on('close', function () {
    if (isMaster) {
      masterId = null;
      console.log('Speaker disconnected');
    } else {
      delete listeners[connectionId];
      console.log('Listener disconnected');
    }
  });
});

console.log('Listening on port:', wsPort);