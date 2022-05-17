'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.redirect('/public/one2oneAudio.html');
  }

  async httpCallback() {
    const { ctx, app } = this;
    const { logger } = app;
    const body = ctx.request.body;
    logger.info('[home.js] srs httpCallback body: ', body);
    // 成功: srs客户端可以继续 操作
    this.ctx.body = 0;
    // 失败: 中断srs客户端操作
    this.ctx.body = 1;
  }
}

module.exports = HomeController;
