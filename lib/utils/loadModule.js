module.exports = function loadModule(path) {
  path = resolve(path);
  return path ? ensure(require(path)) : null;
};


function resolve(path) {
  try {
    return require.resolve(path, { paths: [] });
  } catch (e) {
    return null;
  }
}

function ensure(mod) {
  return ('default' in mod) ? mod.default : mod;
}
