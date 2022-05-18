'use strict';


module.exports = appInfo => {

  return {
    srsHttpApi: "http://127.0.0.1:11985", 
    static: {
      maxAge: 0,
      buffer: false,
      preload: false,
      maxFiles: 0,
    },
  };
};
