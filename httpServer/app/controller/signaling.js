const { WebSocketServer } = require('ws');
const port = 11990;
let room_obj = {}
let socket_lient_obj = {}

async function signalingInit() {
  const wss = new WebSocketServer({ port });
  wss.on('connection', function connection(ws,request) {
    ws.on('message', function message(data) {
      console.log('received: %s', data);
      const data_obj = JSON.parse(data.toString())
      if (data_obj.msg.action == 'join') {
        room_obj[data_obj.msg.room] = room_obj[data_obj.msg.room] || []
        const socket_item = room_obj[data_obj.msg.room].find(item=>item.display == data_obj.msg.display)
        let self = {
            room: data_obj.msg.room,
            publishing: false,
            display: data_obj.msg.display
        }
        if (!socket_item) {
          room_obj[data_obj.msg.room].push(self)
        }
        ws.room = data_obj.msg.room
        ws.display =data_obj.msg.display
        socket_lient_obj[`${data_obj.msg.room}`] = socket_lient_obj[`${data_obj.msg.room}`] || []
        socket_lient_obj[data_obj.msg.room][data_obj.msg.display] = ws
        
        ws.send(JSON.stringify({
          tid: data_obj.tid,
          msg: {
            action: data_obj.msg.action,
            room: data_obj.msg.room,
            self,
            participants: room_obj[data_obj.msg.room]
          }
        }));
        
      } else if (data_obj.msg.action == 'publish') {
        if (!room_obj[data_obj.msg.room]) {
          return;
        }
        const peer = room_obj[data_obj.msg.room].find(item=>item.display == data_obj.msg.display)
        if (!peer) {
          return;
        }
        peer.publishing = true
        if (data_obj.msg.video != null) {
          peer.video = !!data_obj.msg.video    
        }
        if (data_obj.msg.audio != null) {
          peer.audio = !!data_obj.msg.audio    
        }
        ws.send(JSON.stringify({
          tid: data_obj.tid,
          msg: null
        }))
        notify(data_obj.msg.room, peer, data_obj.msg.action)
      } else if (data_obj.msg.action == 'control') {
        if (!room_obj[data_obj.msg.room]) {
          return;
        }
        const peer = room_obj[data_obj.msg.room].find(item=>item.display == data_obj.msg.display)
        if (!peer) {
          return;
        }
        ws.send(JSON.stringify({
          tid: data_obj.tid,
          msg: null
        }))
        notify(data_obj.msg.room, peer, data_obj.msg.action, data_obj.msg.param, data_obj.msg.data)
      } else {
        if (!room_obj[data_obj.msg.room]) {
          return;
        }
        const peer = room_obj[data_obj.msg.room].find(item=>item.display == data_obj.msg.display)
        if (!peer) {
          return;
        }
        ws.send(JSON.stringify({
          tid: data_obj.tid,
          msg: {
            action: "notify",
            event: data_obj.msg.action,
            room: data_obj.msg.room,
            data: { ...data_obj.msg }
          }
        }))
        notify(data_obj.msg.room, peer, data_obj.msg.action, data_obj.msg.param, { ...data_obj.msg })
      }
    });
    ws.on('close', function close(a, b, c) {
      const peer = room_obj[ws.room].find(item=>item.display == ws.display)
      room_obj[ws.room] = room_obj[ws.room].filter(item=>{
        return item.display != ws.display
      })
      notify(ws.room, peer, 'leave', '', '')
      delete socket_lient_obj[ws.room][ws.display]
      console.log('disconnected room', ws.room);
      console.log('disconnected display', ws.display);
    });
  });
  console.log("信令服务启动(WebSocketServer), port:", port, "url:", "/sig/v1/rtc");
}

async function notify(room, peer, event, param, data) {
  if (!room_obj[room]) {
      console.error(`room: ${room} no users`)
    return;
  }
  for (let item of room_obj[room]) {
    if (item.display == peer.display) {
      continue;
    }
    let socket_client = socket_lient_obj[room][item.display]
    if (socket_client) {
      socket_client.send(JSON.stringify({
        msg: {
          room: room,
          action: "notify",
          event: event,
          param: param,
          data: data,
          self: item,
          peer,
          participants: room_obj[room],
        }
      }))
    }
  }
}

module.exports = signalingInit;
