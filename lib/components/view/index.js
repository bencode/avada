const fs = require('fs');
const pathUtil = require('path');
const ejs = require('ejs');
const ViewContainer = require('./ViewContainer');


module.exports = function ViewComponent(app, settings) {
  const env = settings.env;
  const container = new ViewContainer({ env });

  app.engine = container.engine.bind(container);
  app.view = container.add.bind(container);
  app.config.render = async function(data) {
    this.body = await container.render(data);
  };

  const config = settings.view || {};
  const viewRoot = config.viewRoot || pathUtil.join(settings.appRoot, 'views');
  installDefaultEngine(container, { env, config });
  setupViews(container, { env, viewRoot });
};

function installDefaultEngine(container, { env, config }) {
  container.engine('ejs', (template, { path: parent }) => {
    const includer = name => {
      const path = pathUtil.relative(parent, `${name}.ejs`);
      const body = fs.readFileSync(path, 'utf-8');
      return { filename: path, template: body };
    };
    const opts = {
      compileDebug: env === 'development',
      includer,
      ...config.ejs
    };
    return ejs.compile(template, opts);
  });
}

function setupViews(container, { viewRoot }) {
  const list = scan(viewRoot, viewRoot);
  console.log(list);
}

function scan(path, root) {
  const list = fs.readdirSync(path, { withFileTypes: true });
  return list.reduce((acc, dirent) => {
    const current = pathUtil.join(path, dirent.name);
    if (dirent.isDirectory()) {
      acc.push(...scan(current, root));
    } else if (dirent.isFile()) {
      const relative = pathUtil.relative(root, current);
      acc.push(relative);
    }
    return acc;
  }, []);
}
