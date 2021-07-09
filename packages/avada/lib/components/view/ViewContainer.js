const fs = require('fs');
const debug = require('debug')('avada:view');

module.exports = class ViewContainer {
  constructor({ env }) {
    this.env = env;
    this.engines = {};
    this.views = new Map();
  }

  engine(type, compiler) {
    const engines = this.engines;

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
  }

  compile(type, path) {
    const body = fs.readFileSync(path, 'utf-8');
    const compiler = this.engines[type];
    debug('compile view: %s', path);
    return compiler(body, { path });
  }

  add(type, name, path) {
    const { env, engines, views } = this;
    const compiler = engines[type];
    if (!compiler) {
      throw new Error(`template engine [${type}] not found.`);
    }
    if (views.has(name)) {
      global.console.error(`view exists: ${path}`);
    }

    debug('add view: [%s] %s: %s', type, name, path);
    const render = env === 'development' ? null : this.compile(type, path);
    views.set(name, { type, path, render });
  }

  async render(name, data) {
    const item = this.views.get(name);
    if (!item) {
      throw new Error(`view not found: ${name}`);
    }
    const fn = item.render || this.compile(item.type, item.path);
    return fn(data);
  }
};
