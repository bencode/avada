const debug = require('debug')('avada:controller');


module.exports = class ControllerContainer {
  constructor() {
    this.map = new Map();
  }

  add(name, controller) {
    if (this.map.has(name)) {
      global.console.error(`controller already exists: ${name}`);
      return;
    }
    debug('add controller: %s', name);
    this.map.set(name, controller);
  }

  invoke(module, action, ctx) {
    const controller = this.map.get(module);
    debug('invoke %s[%s]', module, action);
    return controller[action](ctx);
  }

  has(module, action) {
    const controller = this.map.get(module);
    return controller && typeof controller[action] === 'function';
  }
};
