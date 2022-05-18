async function socketIOInit(app) {
    const {
      socketIO,
      logger,
    } = app;
  
    const socketIOConnectEventBuild = (socketIO) => {
      socketIO.use(async function (socket, next) {
        next();
      });
    };
  
    const socketIOOtherEventBuild = (socketIO) => {
      socketIO.on("connection", (socket) => {
        const { id: socketId } = socket;
        logger.info("[socket connection success]", { socketId });
  
        // 业务入口
        socket.on("message", async function (data) {
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
              return ws.send(JSON.stringify({
                tid: data_obj.tid,
                msg: `Invalid msg: ${JSON.stringify(data_obj.msg)}`
              }))
            }   
          
            // 之前的代码  
            const { packageId, appData } = body;
            const { appId, pageId, actionId } = appData;
            try {
                await socketRequest({ socket, app, body }, () => {});
            } catch (err) {
                logger.error("[resource.js socketIOOtherEventBuild]", err);
                const errorCode =
                err.errorCode || err.code || errorInfoEnum.server_error.errorCode;
                const errorReason =
                err.errorReason ||
                err.sqlMessage ||
                err.message ||
                errorInfoEnum.server_error.errorReason;
                const errorReasonSupplement = err.errorReasonSupplement || null;
                const socketBody = socketResponse.fail({
                packageId,
                appData: {
                    errorCode,
                    errorReason,
                    errorReasonSupplement,
                    appId,
                    pageId,
                    actionId,
                },
                });
                socket.emit(resourcePath, socketBody);
            }
        });
  
        // 断线
        socket.on("disconnect", async function (message) {
          const { id: socketId } = socket;
          logger.warn("[socket disconnect]", { socketId, message });
  
          // 调用应用层的 disconnect 方法
          const body = socketRequestBodyBuild.bodyBuild({
            appData: {
              appId,
              pageId: "socket",
              actionId: "disconnect",
              authToken: null,
              actionData: { message },
            },
          });
          await socketRequest({ socket, app, body }, () => {});
        });
      });
    };
  
    socketIOConnectEventBuild(socketIO);
    socketIOOtherEventBuild(socketIO);
  }