const fs = require('fs');
const debug = require('debug')('avada:view');


module.exports = function ViewContainer({ env }) {
  const engines = {};
  const views = new Map();

  const engine = (type, compiler) => {
    // getter
    if (typeof compiler === 'undefined') {
      return engines[type];
    }

    if (engines[type]) {
      global.console.error(`template engine ${type} exists.`);
      return null;
    }

    engines[type] = compiler;
    return compiler;
  };

  const compile = (type, path) => {
    const body = fs.readFileSync(path, 'utf-8');
    const compiler = engines[type];
    debug('compile view: %s', path);
    return compiler(body, { path });
  };

  const add = (type, name, path) => {
    const compiler = engines[type];
    if (!compiler) {
      throw new Error(`template engine [${type}] not found.`);
    }
    if (views.has(name)) {
      global.console.error(`view exists: ${path}`);
    }

    debug('add view: [%s] %s: %s', type, name, path);
    const render = env === 'development' ? null : compile(type, path);
    views.set(name, { type, path, render });
  };

  const render = async(name, data) => {
    const item = views.get(name);
    if (!item) {
      throw new Error(`view not found: ${name}`);
    }
    const fn = item.render || compile(item.type, item.path);
    return fn(data);
  };

  return { engine, add, render };
};
