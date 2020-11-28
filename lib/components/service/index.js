const fs = require('fs');
const pathUtil = require('path');
const debug = require('debug')('avada:service');
const loadModule = require('../../utils/loadModule');


module.exports = function ServiceComponent(app, settings) {
  const service = new ServiceRegistry(app);
  app.service = service.add.bind(service);

  const appRoot = settings.applicationRoot;
  const config = settings.service || {};
  const serviceRoot = config.serviceRoot || pathUtil.join(appRoot, 'services');

  setupServices(service, { serviceRoot });

  return () => service.start();
};


function ServiceRegistry(app) {
  const services = {};

  const add = (name, mod) => {
    if (services[name]) {
      global.console.error(`service already exists: ${name}`);
      return;
    }
    debug('add service: %s', name);
    services[name] = mod;
  };

  const start = async() => {
    for (const name of Object.keys(services)) {
      await startService(app, name, services[name]);  // eslint-disable-line
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


function setupServices(service, { serviceRoot }) {
  const list = fs.readdirSync(serviceRoot);
  for (const file of list) {
    const name = pathUtil.basename(file, pathUtil.extname(file));
    const path = pathUtil.join(serviceRoot, file);
    const mod = loadModule(path);
    if (mod && isService(mod)) {
      service.add(name, mod);
    }
  }
}


function isService(mod) {
  return typeof mod === 'function';
}
