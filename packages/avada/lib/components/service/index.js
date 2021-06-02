const pathUtil = require('path');
const scanAppModules = require('../../utils/scanAppModules');
const loadModule = require('../../utils/loadModule');
const ServiceContainer = require('./ServiceContainer');


module.exports = function ServiceComponent(app, settings) {
  const container = new ServiceContainer(app);
  app.Service = container;

  const appRoot = settings.applicationRoot;
  const config = settings.service || {};
  const serviceRoot = config.serviceRoot || pathUtil.join(appRoot, 'services');

  setupServices(container, { serviceRoot });

  return [
    () => container.start(),
    () => container.stop()
  ];
};


function setupServices(container, { serviceRoot }) {
  const list = scanAppModules(serviceRoot);
  for (const file of list) {
    const name = pathUtil.basename(file, pathUtil.extname(file));
    const path = pathUtil.join(serviceRoot, file);
    const mod = loadModule(path);
    const service = mod && mod.default ? mod.default : mod;
    if (service && typeof service === 'function') {
      container.add(name, mod);
    }
  }
}
