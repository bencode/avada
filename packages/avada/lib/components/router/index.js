const pathUtil = require('path');
const debug = require('debug')('avada:router');
const { tryLoadModule } = require('../../utils/module');
const pathToRegexp = require('../../utils/pathToRegexp');
const parse = require('./parse');
const AppRouter = require('./Router');


module.exports = function RouterComponent(app, settings) {
  const router = new AppRouter();
  app.Router = router;

  const appRoot = settings.applicationRoot;
  const config = settings.router || {};
  const configRoot = config.configPath || pathUtil.join(appRoot, 'router');

  const fn = tryLoadModule(configRoot);
  if (typeof fn === 'function') {
    const { middlewares, routes } = parse(fn);
    setupMiddlewares(app, middlewares);
    setupRules(router, routes);
  } else {
    global.console.error('router file not exits');
  }

  app.use(createRouter(router), { level: 2 });
};

function setupMiddlewares(app, middlewares) {
  for (const item of middlewares) {
    const { middleware, match, options } = item;
    const mw = match || options.method ?
      wrapMiddleware(middleware, { match, method: options.method }) : middleware;

    const level = options.level || 3;
    app.use(mw, { level });
  }
}

function wrapMiddleware(middleware, { match, method }) {
  const re = match && pathToRegexp(match);
  const name = `${match} -> ${middleware.$name || middleware.name}`;
  debug('wrap middleware: %s -> %s', re, name);

  const result = (ctx, next) => {
    if (!method || testMethod(ctx, method)) {
      if (!re || re.test(ctx.path)) {
        debug('%s -> %s', ctx.path, name);
        return middleware(ctx, next);
      }
    }
    return next();
  };

  result.$name = name;
  return result;
}


/*
 * 验证method是否有效
 */
function testMethod(ctx, method) {
  const m = ctx.method.toLowerCase();
  if (typeof method === 'string') {
    return method === m;
  }
  // for Array
  return method.indexOf(m) !== -1;
}


function setupRules(router, routes) {
  for (const route of routes) {
    router.add(route.match, route.to, { method: route.verb });
  }
}

function createRouter(router) {
  return function Router(ctx, next) {
    // 如果有其他中间件能搞定这事就不管了
    if (ctx.route) {
      debug('already routed: %o', ctx.route);
      return next();
    }

    const path = ctx.path;
    const method = ctx.method;
    const route = router.route(path, { method });

    if (route) {
      ctx.route = route;
    } else {
      ctx.route = null;
    }

    return next();
  };
}
