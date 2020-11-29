const fs = require('fs');
const pathUtil = require('path');
const ejs = require('ejs');
const ViewContainer = require('./ViewContainer');


module.exports = function ViewComponent(app, settings) {
  const env = settings.env;
  const container = new ViewContainer({ env });

  app.engine = container.engine.bind(container);
  app.view = container.add.bind(container);
  app.context.render = async function(name, data) {
    this.body = await container.render(name, data);
  };

  const config = settings.view || {};
  const viewRoot = config.viewRoot || pathUtil.join(settings.appRoot, 'views');
  installDefaultEngine(container, { env, config });
  setupViews(container, { env, viewRoot });
};

function installDefaultEngine(container, { env, config }) {
  container.engine('ejs', (template, { path: parent }) => {
    const includer = name => {
      const path = pathUtil.join(pathUtil.dirname(parent), `${name}.ejs`);
      const body = fs.readFileSync(path, 'utf-8');
      return { filename: path, template: body };
    };
    const opts = {
      compileDebug: env === 'development',
      debug: !!process.env.DEBUG_EJS,
      includer,
      ...config.ejs
    };
    return ejs.compile(template, opts);
  });
}

function setupViews(container, { viewRoot }) {
  const isView = rpath => (/^[a-zA-Z]/).test(pathUtil.basename(rpath));
  const list = scan(viewRoot, viewRoot).filter(isView);
  for (const rpath of list) {
    const { type, name } = parseViewPath(rpath);
    if (container.engine(type)) {
      const path = pathUtil.join(viewRoot, rpath);
      container.add(type, name, path);
    }
  }
}

function scan(path, root) {
  const list = fs.readdirSync(path, { withFileTypes: true });
  return list.reduce((acc, dirent) => {
    const current = pathUtil.join(path, dirent.name);
    if (dirent.isDirectory()) {
      acc.push(...scan(current, root));
    } else if (dirent.isFile()) {
      const rpath = pathUtil.relative(root, current);
      acc.push(rpath);
    }
    return acc;
  }, []);
}

function parseViewPath(path) {
  const ext = pathUtil.extname(path);
  const base = pathUtil.join(pathUtil.dirname(path), pathUtil.basename(path, ext));
  const type = ext.substr(1);
  const name = base.replace(/\\/g, '/');
  return { type, name };
}
