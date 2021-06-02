module.exports = function loadModule(path) {
  try {
    const mod = require(path);
    return ('default' in mod) ? mod.default : mod;
  } catch (e) {
    global.console.error(e);
    return null;
  }
};
