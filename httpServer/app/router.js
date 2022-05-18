'use strict';

module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.post('/srs/httpCallback', controller.srs.httpCallback);
  router.post('/srs/httpApiProxy', controller.srs.httpApiProxy);
};
