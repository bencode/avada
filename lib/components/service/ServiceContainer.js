const debug = require('debug')('avada:service');


module.exports = class ServiceContainer {
  constructor(app) {
    this.app = app;
    this.defines = new Map();
  }

  add(name, mod) {
    const map = this.defines;
    if (map.has(name)) {
      global.console.error(`service already exists: ${name}`);
      return;
    }
    debug('add service: %s', name);
    map.set(name, mod);
  }

  async start() {
    for (const [name, mod] of this.defines.entries()) {
      await startService(this.app, name, mod);    // eslint-disable-line
    }
  }
};


// private

async function startService(app, name, mod) {
  if (typeof mod.startup === 'function') {
    debug('startup sevice %s', name);
    await mod.startup(app);
  }
  const getter = '$' + name;
  const prop = Symbol(name);
  Object.defineProperty(app.context, getter, {
    get() {
      if (!this[prop]) {
        const service = typeof mod === 'function' ? newService(mod, this) : mod;
        this[prop] = service;
      }
      return this[prop];
    }
  });
}

function newService(C, ctx) {
  const service = new C(ctx);
  if (!service.ctx) {
    // auto inject ctx
    service.ctx = ctx;
  }
  return service;
}
