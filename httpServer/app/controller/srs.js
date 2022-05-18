'use strict';

const Controller = require('egg').Controller;
const axios = require('axios');

class SRSController extends Controller {

  async httpCallback() {
    const { ctx, app } = this;
    const { logger } = app;
    const body = ctx.request.body;
    logger.info('[home.js] srsHttpCallback body: ', body);
    // 成功: srs客户端可以继续 操作
    this.ctx.body = 0;
    // 失败: 中断srs客户端操作
    // this.ctx.body = 1;
  }

  async httpApiProxy() {
    const { ctx, app } = this;
    const { config: { srsHttpApi }, logger } = app;
    const { param, url } = ctx.request.body;
    const path = url.replace(/^https?:\/\/[^/]+/, '');
    // logger.info('转发 rtc 请求，请求参数:', { method: 'POST', url: `${srsServer}${path}`, data: JSON.stringify(param) });
    const res = await axios({ method: 'POST', url: `${srsHttpApi}${path}`, data: JSON.stringify(param) });
    this.ctx.body = res.data;
  }
}

module.exports = SRSController;
