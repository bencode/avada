/**
 * 错误处理中间件
 */

const util = require('util');

module.exports = function createErrorHandler(config) {
  const development = (config || {}).env === 'development';
  return function errorHandler(ctx, next) {
    return next().catch(e => {
      const status = e.status || 500;
      // 只处理500及以上的异常
      if (status < 500) {
        throw e;
      }

      global.console.error(e);
      ctx.app.emit('error', e, ctx);
      ctx.status = status;

      const message = development ?
        '<pre>' + util.inspect(e) + '\n' + (e.stack || '') + '</pre>' :
        'Internel Server Error';

      if (ctx.is('application/json') ||
          !ctx.accepts('html') && ctx.accepts('application/json')) {
        ctx.body = { success: false, message };
      } else {
        ctx.body = message;
      }
    });
  };
};
