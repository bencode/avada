module.exports = function tryLoadModule(path) {
  path = resolve(path);
  return path ? require(path) : null;
};


function resolve(path) {
  try {
    return require.resolve(path, { paths: [] });
  } catch (e) {
    return null;
  }
}
