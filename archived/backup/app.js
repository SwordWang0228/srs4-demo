'use strict';

const signaling = require('./app/controller/signaling');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');
// const liveSocketIOInit = require('./app/controller/liveSocketResource');

// app.js
class AppBootHook {
  constructor(app) {
    this.app = app;
  }

  async serverDidReady() {
    const { server, logger, config } = this.app;
    const socketIO = new Server({
      serveClient: true,
      connectTimeout: 45000
    });

    // 如果有配置 redis，则使用 redis 作为 socket.io 的 adapter
    if (config.socketIO.redis) {
      const pubClient = new Redis(config.socketIO.redis);
      const subClient = pubClient.duplicate();
      // subClient.set('____test', 'b');
      socketIO.adapter(createAdapter(pubClient, subClient, { key: 'signaling' }));
      logger.info('[egg-socket.io] init socket.io redis ready!');
    }

    socketIO.attach(server, {
      path: config.socketIO.path,
      maxHttpBufferSize: 1e8
    });
    this.app.signalingSocketIO = socketIO;

    logger.info('[signaling] 启动成功', { pid: process.pid, path: config.socketIO.path });

    // liveSocketIOInit(this.app);
  }

  // 所有配置已经加载完毕，用于自定义 Loader 挂载。
  async didLoad() {
    // 启动信令服务
    signaling();
  }
}

module.exports = AppBootHook;

