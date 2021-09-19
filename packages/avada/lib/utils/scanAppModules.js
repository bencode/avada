const fs = require('fs');
const pathUtil = require('path');

module.exports = function scanAppModules(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const list = fs.readdirSync(dir);
  return list.filter(name => isAppModule(name, dir));
};

function isAppModule(name, dir) {
  const rHidden = /^\./;
  // ignore hidden file/dir
  if (rHidden.test(name)) {
    return false;
  }

  // valid js identify
  const rName = /^[a-zA-Z]\w*$/;
  const path = pathUtil.join(dir, name);
  const stats = fs.statSync(path);
  if (stats.isDirectory()) {
    return rName.test(name);
  }
  if (stats.isFile()) {
    const basename = pathUtil.basename(name, pathUtil.extname(name));
    return rName.test(basename);
  }
  return false;
}
