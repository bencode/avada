const { curry } = require('ramda');

exports.parse = curry((define, query) => {
  return Object.keys(define).reduce((acc, name) => {
    const val = query[name];
    const [fn, def] = makeArray(define[name]);
    acc[name] = typeof val === 'string' ? fn(val) :
      typeof val === 'undefined' ? def : val;
    return acc;
  }, {});
});

exports.types = {
  number, string, bool, arrayOf
};

function number(val) {
  return +val;
}

function string(val) {
  return '' + (val || '');
}

function bool(val) {
  return val === 'true' || val === '1';
}

function arrayOf(fn) {
  return val => {
    return val.split(/,/).map(fn);
  };
}

// Utility

function makeArray(val) {
  return Array.isArray(val) ? val : [val];
}
