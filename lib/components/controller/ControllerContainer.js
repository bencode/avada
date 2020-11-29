const debug = require('debug')('avada:controller');


module.exports = function ControllerContainer() {
  const map = new Map();

  const add = (name, controller) => {
    if (map.has(name)) {
      global.console.error(`controller already exists: ${name}`);
      return;
    }
    debug('add controller: %s', name);
    map.set(name, controller);
  };

  const has = (module, action) => {
    const controller = map.get(module);
    return controller && typeof controller[action] === 'function';
  };

  const invoke = (module, action, ctx) => {
    const controller = map.get(module);
    debug('invoke %s[%s]', module, action);
    return controller[action](ctx);
  };

  return { add, has, invoke };
};
