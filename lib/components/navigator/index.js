const fs = require('fs');
const pathUtil = require('path');
const loadModule = require('../../utils/loadModule');
const Controller = require('./Controller');


module.exports = function NavigatorComponent(app, settings) {
  const appRoot = settings.applicationRoot;
  const config = settings.navigator || {};
  const controllerRoot = config.controllerRoot || pathUtil.join(appRoot, 'controllers');

  const controller = new Controller();
  app.controller = controller.add.bind(controller);

  setupControllers(controller, { controllerRoot });

  const navigator = createNavigator({ controller });
  app.use(navigator, { level: 4 });
};


function setupControllers(controller, { controllerRoot }) {
  const list = fs.readdirSync(controllerRoot);
  for (const name of list) {
    const path = pathUtil.join(controllerRoot, name);
    const mod = loadModule(path);
    if (mod) {
      controller.add(name, mod);
    }
  }
}


function createNavigator({ controller }) {
  return function Navigator(ctx, next) {
    const { route } = ctx;
    if (!route) {
      return next();
    }

    if (!controller.has(route.module, route.action)) {
      global.console.error(`action not found: ${route.module}[${route.action}]`);
      return next();
    }

    const query = {
      ...route.query,
      ...ctx.query
    };
    ctx.originalQuery = ctx.query;
    ctx.query = query;

    return controller.invoke(route.module, route.action, ctx);
  };
}
