function tryLoadModule(path) {
  if (checkModule(path)) {
    return loadModule(path);
  }
  return null;
}

function checkModule(path) {
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
