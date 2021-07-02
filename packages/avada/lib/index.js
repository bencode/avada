const Koa = require('koa');
const debug = require('debug')('avada:boot');


const Components = [
  'core', 'web',
  'router', 'controller', 'service', 'view',
  'verify'
];


module.exports = function(config) {
  config = normalizeConfig(config);
  const app = new Koa();
  let started = false;
  let stopped = false;

  const list = [];
  for (const name of Components) {
    const mod = require(`./components/${name}`);
    const com = typeof mod.default === 'function' ? mod.default : mod;
    debug('install component [%s]', name);
    const [start, stop] = makeArray(com(app, config));
    list.push({ name, start, stop });
  }

  app.start = async(opts = {}) => {
    if (started) {
      debug('already started, ignore');
      return null;
    }

    debug('app.start');
    started = true;
    for (const item of list) {
      if (typeof item.start === 'function') {
        debug('start component: %s', item.name);
        await item.start(app, config);  // eslint-disable-line
      }
    }

    const { listen = true } = opts;
    if (listen) {
      const port = (config.server || {}).port || 3000;
      const server = app.listen(port, () => {
        global.console.log(`server listen at: ${port}`);
      });
      return server;
    }
    return null;
  };

  app.stop = async() => {
    if (!started) {
      throw new Error('app not started');
    }
    if (stopped) {
      debug('app stopped, ignore');
      return;
    }
    stopped = true;

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

function normalizeConfig(config) {
  return {
    env: process.env.NODE_ENV || 'development',
    applicationRoot: process.cwd(),
    ...config
  };
}
