/**
 * 错误处理中间件
 */

const util = require('util');


module.exports = function createErrorHandler({ env }) {
  return function errorHandler(ctx, next) {
    return next().catch(e => {
      const status = e.status || 500;
      ctx.app.emit('error', e, ctx);
      const message = getMessage(env, e);
      ctx.status = status;
      if (ctx.is('application/json') ||
          !ctx.accepts('html') && ctx.accepts('application/json')) {
        ctx.body = { success: false, message };
      } else {
        ctx.body = message;
      }
    });
  };
};


function getMessage(env, e) {
  const status = e.status || 500;
  if (status < 500) {
    return e.message || e;
  }

  if (env === 'development') {
    return util.inspect(e);
  }

  return e.message || 'Internel Server Error';
}
