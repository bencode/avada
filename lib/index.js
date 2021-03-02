const Koa = require('koa');
const debug = require('debug')('avada:boot');


const Components = [
  'core', 'web', 'router', 'controller', 'service', 'view'
];


module.exports = function(config) {
  const app = new Koa();

  const list = [];
  for (const name of Components) {
    const mod = require(`./components/${name}`);
    const com = typeof mod.default === 'function' ? mod.default : mod;
    debug('install component [%s]', name);
    const [start, stop] = makeArray(com(app, config));
    list.push({ name, start, stop });
  }

  app.start = async(opts = {}) => {
    debug('app.start');
    for (const item of list) {
      if (typeof item.start === 'function') {
        debug('start component: %s', item.name);
        await item.start(app, config);  // eslint-disable-line
      }
    }

    const { listen = true } = opts;
    if (listen) {
      const port = (config.server || {}).port || 3000;
      const server = app.listen(port);
      global.console.log(`server listen at: ${port}`);
      return server;
    }
  };

  app.stop = async() => {
    debug('app.stop');
    for (const item of list.reverse()) {
      if (typeof item.stop === 'function') {
        debug('stop component: %s', item.name);
        await item.stop(app, config);  // eslint-disable-line
      }
    }
  };

  process.on('SIGINT', async() => {
    try {
      await app.stop();
      process.exit(0);
    } catch (e) {
      global.console.error(e);
      process.exit(1);
    }
  });

  process.on('exit', code => {
    global.console.log(`app exit: ${code}`);
  });

  return app;
};

function makeArray(list) {
  return (list === undefined || list === null) ? [] :
    Array.isArray(list) ? list : [list];
}
