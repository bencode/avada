const debug = require('debug')('avada:service');

const CONTEXT = Symbol('service-context');
const CONTEXT_INST = Symbol('service-context-inst');


module.exports = class ServiceContainer {
  constructor(app) {
    this.app = app;
    this.defines = new Map();

    this.Context = function ServiceContext() {
      this.config = app.config;
    };

    defineContext(app, this.Context);
  }

  add(name, mod) {
    const map = this.defines;
    if (map.has(name)) {
      global.console.error(`service already exists: ${name}`);
      return;
    }
    debug('add service: %s', name);
    map.set(name, mod);

    defineService(this.app, this.Context.prototype, name, mod);
  }

  createContext() {
    return new this.Context();
  }

  async start() {
    for (const [name, mod] of this.defines.entries()) {
      await startupService(this.app, name, mod);    // eslint-disable-line
    }
  }
};


// private

function defineContext(app, Context) {
  Object.defineProperty(app.context, CONTEXT, {
    get() {
      if (!this[CONTEXT_INST]) {
        this[CONTEXT_INST] = new Context();
      }
      return this[CONTEXT_INST];
    }
  });
}

function defineService(app, proto, name, mod) {
  const getter = '$' + name;
  const prop = Symbol(name);

  Object.defineProperty(proto, getter, {
    get() {
      if (!this[prop]) {
        const service = typeof mod === 'function' ? newService(mod, this) : mod;
        this[prop] = service;
      }
      return this[prop];
    }
  });

  Object.defineProperty(app.context, getter, {
    get() {
      return this[CONTEXT][getter];
    }
  });
}

async function startupService(app, name, mod) {
  if (typeof mod.startup === 'function') {
    debug('startup sevice %s', name);
    await mod.startup(app);
  }
}

function newService(C, ctx) {
  const service = new C(ctx);
  if (!service.ctx) {
    // auto inject ctx
    service.ctx = ctx;
  }
  return service;
}
