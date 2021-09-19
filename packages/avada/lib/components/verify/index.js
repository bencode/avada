const chalk = require('chalk');

module.exports = function VerifyComponent(app) {
  const { routes } = app.Router;
  for (const route of routes) {
    const { rule } = route;
    if (!app.Controller.has(rule.module, rule.action)) {
      global.console.error(chalk.red(`action not exists: ${rule.module}#${rule.action}`));
      global.console.error('route detail %o', route);
    }
  }
};
