'use strict';

module.exports = appInfo => {
  return {
    srsHttpApi: "http://127.0.0.1:1985",
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
  };
};
