'use strict';

const path = require("path");

module.exports = appInfo => {
  return {
    srsHttpApi: "https://srs.openjianghu.org",
    middleware: [],
    cors: {
      origin: "*",
      allowMethods: "GET,HEAD,PUT,POST,DELETE,PATCH",
    },
    security: {
      csrf: { enable: false },
    },
    static: {
      maxAge: 0,
      buffer: false,
      preload: false,
      maxFiles: 0,
    },
    logger: {
      outputJSON: true,
      level: "INFO",
      dir: path.join(appInfo.baseDir, "logs"),
      contextFormatter(meta) {
        return `[${meta.date}] [${meta.level}] [${meta.ctx.method} ${meta.ctx.url}] ${meta.message}`;
      },
    },
  };
};
