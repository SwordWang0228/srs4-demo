'use strict';

module.exports = appInfo => {
  return {
    srsHttpApi: "http://127.0.0.1:11985", 
    keys: appInfo.name + '_1652796711760_7833',
    middleware: [],
    cors: {
      origin: "*",
      allowMethods: "GET,HEAD,PUT,POST,DELETE,PATCH",
    },
    security: {
      csrf: { enable: false },
    },
  };
};
