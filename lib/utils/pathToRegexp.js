const { pathToRegexp: parse } = require('path-to-regexp');

module.exports = function pathToRegexp(pattern) {
  if (pattern && typeof pattern === 'string') {
    return parse(pattern.replace(/\/\*/g, '/(.*)'));
  }
  return pattern || null;
};
