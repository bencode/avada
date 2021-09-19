const avada = require('avada');
const request = require('supertest');

exports.createApp = function createApp(config) {
  const app = avada(config);
  const startDefer = app.start({ listen: false });

  const start = async() => {
    await startDefer;
  }

  const agent = () => request.agent(app.callback());

  const get = (...args) => {
    return request.agent(app.callback()).get(...args);
  };

  return { start, agent, get };
};
