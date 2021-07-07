const { v4: uuid } = require('uuid');
const debug = require('debug')('avada:web');
const util = require('./util');


module.exports = function WebComponent(app, settings) {
  const config = settings.web || {};
  initKeys(app, config.keys);

  require('./params')(app);

  installKoaUtillity(app, config);
  installSession(app, config.session);
  installFlash(app, config.flash);
  installSecurity(app, config.security);
  installCors(app, config.cors);
};


// private

function initKeys(app, keys) {
  if (!keys) {
    keys = uuid();
    global.console.warn('app.keys missing, auto gen: %s', keys);
  }
  keys = typeof keys === 'string' ? [keys] : keys;
  app.keys = keys;
}


function installKoaUtillity(app, config) {
  install(app, 'koa-favicon', config.favicon);
  install(app, 'koa-response-time', config.rtime);
  install(app, 'koa-conditional-get', config.conditional);
  install(app, 'koa-etag', config.etag);
  install(app, 'koa-compress', config.compress);

  // 默认开启body parser
  install(app, 'koa-bodyparser', config.bodyParser || {});

  config.static && installStatic(app, config.static);
}


function install(app, name, config) {
  if (!config || config.enable === false) {
    return;
  }

  const fn = require(name);
  const mw = fn(config);
  mw.$name = name;
  add(app, mw);
}


function installCors(app, config = {}) {
  const match = config.match || [];
  if (!match.length) {
    return;
  }
  const rules = util.regularRules(match);
  const cors = require('@koa/cors');
  const origin = ctx => {
    if (util.testRules(rules, ctx.hostname)) {
      return ctx.get('Origin');
    }
    return null;
  };
  const opts = { origin, ...config };
  const mw = cors(opts);
  add(app, mw);
}


function installStatic(app, config) {
  const { root, ...opts } = config;
  const mw = require('koa-static')(root, opts);
  mw.$name = 'static';
  mw.$args = config;
  add(app, mw, 5);
}


function installSession(app, config) {
  const mw = require('./session')(config, app);
  add(app, mw);
}


function installFlash(app) {
  const mw = require('./flash')(app);
  add(app, mw);
}


function installSecurity(app, config) {
  const mw = require('./security')(config);
  add(app, mw);
}


function add(app, mw, level = 0) {
  debug('add %s, %o', mw.$name || mw.name, mw.$args || {});
  app.use(mw, { level });
}
