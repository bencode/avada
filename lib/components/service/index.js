const fs = require('fs');
const pathUtil = require('path');
const loadModule = require('../../utils/loadModule');
const ServiceContainer = require('./ServiceContainer');


module.exports = function ServiceComponent(app, settings) {
  const container = new ServiceContainer(app);
  app.service = container.add.bind(container);

  const appRoot = settings.applicationRoot;
  const config = settings.service || {};
  const serviceRoot = config.serviceRoot || pathUtil.join(appRoot, 'services');

  setupServices(container, { serviceRoot });

  return () => container.start();
};


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
