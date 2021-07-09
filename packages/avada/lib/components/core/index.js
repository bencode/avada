const assert = require('assert');
const { sortBy } = require('ramda');
const debug = require('debug')('avada:core');
const createErrorHandler = require('./errorHandler');


module.exports = function CoreComponent(app, settings) {
  setupConfig(app, settings);
  const starter = hookUse(app);

  const errorHandler = createErrorHandler(app);
  app.use(errorHandler, { level: 3 });

  return starter;
};


function setupConfig(app, settings) {
  const appConfig = {
    env: settings.env,
    applicationRoot: settings.applicationRoot,
    ...settings.app
  };

  const props = {
    get() {
      return appConfig;
    }
  };

  Object.defineProperty(app, 'config', props);
  Object.defineProperty(app.context, 'config', props);
}


function hookUse(app) {
  const list = [];

  const use = app.use;
  app.use = (middleware, options) => {
    assert(
      typeof middleware === 'function',
      'middleware should be typeof function'
    );

    options = { level: 3, ...options };
    list.push({ middleware, options });
  };

  // install middleware in startup routing
  return () => {
    const sorted = sortBy(item => item.options.level, list);
    const oriUse = fn => use.call(app, fn);
    useMiddlewares(oriUse, sorted);
  };
}


function useMiddlewares(use, list) {
  for (const item of list) {
    const mw = item.middleware;
    const opts = item.options;
    debug('use %s, %o', mw.$name || mw.name, opts);
    use(mw);
  }
}
