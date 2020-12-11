const { pathToRegexp } = require('path-to-regexp');
const debug = require('debug')('avada:router/Router');


const rNum = /^\d+$/;

module.exports = class Router {
  constructor() {
    this.routes = [];
  }

  /**
   * 添加路由规则
   *
   * @param {String|RegExp} pattern - 用于url匹配的规则
   *  目前路由匹配是使用`path-to-regexp`这个库来实现的
   *  它可以很方便地将路径样式的字符串转换成正则表达式
   *
   * @param {String|Object} rule     - 定位的规则
   * @param {Object} options         - 额外的选项
   *  - method {String|Array} 只允许指定method
   */
  add(pattern, rule, options = {}) {
    const keys = [];
    const regexp = pathToRegexp(pattern, keys);
    const queries = keys.map((key, index) => {
      const name = key.name;
      return rNum.test(name) ? null : { index: index + 1, name };
    }).filter(v => v);

    rule = typeof rule === 'string' ? parseRule(rule) : rule;
    const item = { regexp, queries, rule, options };
    debug('add %o', item);
    this.routes.push(item);
  }

  /**
   * 将path路由成RouteInfo
   *
   * @param {String}  path    - 路径
   * @param {Object}  request - 选项
   *  - method 当前请求method
   *
   * @return {Object|null} - 路由信息
   *  - module  {String}
   *  - action  {String}
   *  - query   {Object}
   */
  route(path, request) {
    if (this.routes.length === 0) {
      return null;
    }
    for (const item of this.routes) {
      // 对规则进行一次正则匹配，成功后将不对后续的路由进行匹配
      if (verifyRequest(item, request)) {
        const match = item.regexp.exec(path);
        if (match) {
          const result = createRouteInfo(item, match);
          debug('route success: %o', result);
          return result;
        }
      }
    }
    return null;
  }
};


// private

/*
 * 测试是否允许访问
 * - method是否匹配
 */
function verifyRequest(item, request) {
  const method = item.options.method;
  if (!method || !request) {
    return true;
  }

  const current = request.method.toLowerCase();
  if (typeof method === 'string') {
    return current === method;
  }

  // for Array
  return method.indexOf(current) !== -1;
}

function parseRule(rule) {
  const parts = rule.split('#');
  return { module: parts[0], action: parts[1] };
}

function createRouteInfo(item, match) {
  const { rule, queries } = item;
  const paramQuery = queries.reduce((acc, { name, index }) => {
    acc[name] = match[index];
    return acc;
  }, {});

  const query = rule.query ? { ...paramQuery, ...rule.query } : paramQuery;
  return { module: rule.module, action: rule.action, query };
}
