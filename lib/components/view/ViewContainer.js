const fs = require('fs');
const pathUtil = require('path');


module.exports = function ViewContainer({ env }) {
  const engines = {};
  const views = new Map();

  const engine = (type, compiler) => {
    if (engines[type]) {
      global.console.error(`template engine ${type} exists.`);
      return;
    }
    engines[type] = compiler;
  };

  const compile = (type, path) => {
    const body = fs.readFileSync(path, 'utf-8');
    const compiler = engines[type];
    return compiler(body, { path });
  };

  const add = (name, path) => {
    const type = pathUtil.extname(path);
    const compiler = engines[type];
    if (compiler) {
      throw new Error(`template engine [${type}] not found.`);
    }
    if (views.has(name)) {
      global.console.error(`view exists: ${path}`);
    }
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
