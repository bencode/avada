const pathUtil = require('path');

const EXTS = Object.keys(require.extensions);

module.exports = function loadModule(path) {
  path = resolve(path);
  return path ? ensure(require(path)) : null;
};

function resolve(path) {
  const ext = pathUtil.extname(path);
  if (ext && !EXTS.includes(ext)) {
    return null;
  }
  try {
    return require.resolve(path, { paths: [] });
  } catch (e) {
    return null;
  }
}

function ensure(mod) {
  return ('default' in mod) ? mod.default : mod;
}
