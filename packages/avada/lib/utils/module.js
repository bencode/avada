const fs = require('fs');

function tryLoadModule(path, opts = { checkExists: true }) {
  if (checkModule(path, opts.checkExists)) {
    return loadModule(path);
  }
  return null;
}

function checkModule(path, checkExists) {
  if (checkExists && !fs.existsSync(path)) {
    return false;
  }
  try {
    require.resolve(path);
    return true;
  } catch (e) {
    return false;
  }
}

function loadModule(path) {
  const mod = require(path);
  return ('default' in mod) ? mod.default : mod;
}

module.exports = { tryLoadModule, checkModule, loadModule };
