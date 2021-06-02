const { parse, types } = require('./param');

test('parse', () => {
  const query = {
    pageIds: '1,3,5',
    type: '3',
    action: '1',
    name: 'test',
    define: 'product'
  };
  const params = parse({
    pageIds: types.arrayOf(types.number),
    type: types.number,
    action: types.number,
    name: types.string,
    define: types.string
  }, query);

  expect(params).toEqual({
    pageIds: [1, 3, 5],
    type: 3,
    action: 1,
    name: 'test',
    define: 'product'
  });
});
