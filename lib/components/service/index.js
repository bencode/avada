const fs = require('fs');
const pathUtil = require('path');
const debug = require('debug')('avada:service');
const loadModule = require('../../utils/loadModule');


module.exports = function ServiceComponent(app, settings) {
  const container = new ServiceContainer(app);
  app.service = container.add.bind(container);

  const appRoot = settings.applicationRoot;
  const config = settings.service || {};
  const serviceRoot = config.serviceRoot || pathUtil.join(appRoot, 'services');

  setupServices(container, { serviceRoot });

  return () => container.start();
};


function ServiceContainer(app) {
  const services = new Map();

  const add = (name, mod) => {
    if (services.has(name)) {
      global.console.error(`service already exists: ${name}`);
      return;
    }
    debug('add service: %s', name);
    services.set(name, mod);
  };

  const start = async() => {
    for (const [name, mod] of services.entries()) {
      await startService(app, name, mod);  // eslint-disable-line
    }
  };

  return { add, start };
}


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


function setupServices(container, { serviceRoot }) {
  const list = fs.readdirSync(serviceRoot);
  for (const file of list) {
    const name = pathUtil.basename(file, pathUtil.extname(file));
    const path = pathUtil.join(serviceRoot, file);
    const mod = loadModule(path);
    if (mod && isService(mod)) {
      container.add(name, mod);
    }
  }
}


function isService(mod) {
  return typeof mod === 'function';
}
