const fs = require('fs');
const pathUtil = require('path');
const loadModule = require('../../utils/loadModule');
const ControllerContainer = require('./ControllerContainer');


module.exports = function ControllerComponent(app, settings) {
  const appRoot = settings.applicationRoot;
  const config = settings.navigator || {};
  const controllerRoot = config.controllerRoot || pathUtil.join(appRoot, 'controllers');

  const container = new ControllerContainer();
  app.Controller = container;

  setupControllers(container, { controllerRoot });

  const navigator = createNavigator({ container });
  app.use(navigator, { level: 4 });
};


function setupControllers(controller, { controllerRoot }) {
  const rHidden = /^\..+/;
  const list = fs.readdirSync(controllerRoot)
    .filter(name => !rHidden.test(name));
  for (const file of list) {
    const path = pathUtil.join(controllerRoot, file);
    const mod = loadModule(path);
    if (mod) {
      const name = pathUtil.basename(file, pathUtil.extname(file));
      controller.add(name, mod);
    }
  }
}


function createNavigator({ container }) {
  return function Navigator(ctx, next) {
    const { route } = ctx;
    if (!route) {
      return next();
    }

    if (!container.has(route.module, route.action)) {
      global.console.error(`action not found: ${route.module}[${route.action}]`);
      return next();
    }

    const query = {
      ...route.query,
      ...ctx.query
    };
    ctx.originalQuery = ctx.query;
    ctx.query = query;

    return container.invoke(route.module, route.action, ctx);
  };
}
