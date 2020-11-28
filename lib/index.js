const Koa = require('koa');
const debug = require('debug')('avada:boot');


const Components = [
  'core', 'web', 'router', 'controller', 'service'
];


module.exports = function(config) {
  const app = new Koa();

  const list = [];

  for (const name of Components) {
    const mod = require(`./components/${name}`);
    const com = typeof mod.default === 'function' ? mod.default : mod;
    debug('install component [%s]', name);
    const fn = com(app, config);
    list.push({ name, fn });
  }

  app.start = async() => {
    for (const item of list) {
      if (typeof item.fn === 'function') {
        debug('start component [%s]', item.name);
        await item.fn(app, config);  // eslint-disable-line
      }
    }

    const port = (config.server || {}).port || 3000;
    app.listen(port);
    global.console.log(`server listen at: ${port}`);
  };

  return app;
};
