const session = require('koa-session');


module.exports = function(opts, app) {
  const { store, storeOpts, ...extra } = opts || {};

  const config = {
    store: createStore(store, storeOpts),
    ...extra
  };

  return session(config, app);
};

function createStore(store, opts) {
  if (store === 'redis') {
    return require('koa-redis')(opts);
  }
  return null;
}
