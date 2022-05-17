'use strict';

const signaling = require('./app/controller/signaling');

// app.js
class AppBootHook {
  constructor(app) {
    this.app = app;
  }

  // 所有配置已经加载完毕，用于自定义 Loader 挂载。
  async didLoad() {
    // 启动信令服务
    signaling();
  }
}

module.exports = AppBootHook;

