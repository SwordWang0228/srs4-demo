'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.redirect('/public/one2oneAudio.html');
  }

  async srsHttpCallback() {
    const { ctx, app } = this;
    const { logger } = app;
    const body = ctx.request.body;
    logger.info('[home.js] srsHttpCallback body: ', body);
    // 成功: srs客户端可以继续 操作
    this.ctx.body = 0;
    // 失败: 中断srs客户端操作
    // this.ctx.body = 1;
  }

  async srsHttpApiProxy() {
    const { ctx, app } = this;
    const { config: { srsHttpApi }, logger } = app;
    const { param, url } = ctx.request.body;
    const path = url.replace(/^https?:\/\/[^/]+/, '');
    // logger.info('转发 rtc 请求，请求参数:', { method: 'POST', url: `${srsServer}${path}`, data: JSON.stringify(param) });
    const res = await axios({ method: 'POST', url: `${srsServer}${path}`, data: JSON.stringify(param) });
    return res.data;
  }
}

module.exports = HomeController;
