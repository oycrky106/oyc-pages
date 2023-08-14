const oycPages = require('..')

// TODO: Implement module test
test('oyc-pages', () => {
  expect(oycPages('w')).toBe('w@zce.me')
  expect(oycPages('w', { host: 'wedn.net' })).toBe('w@wedn.net')
  expect(() => oycPages(100)).toThrow('Expected a string, got number')
})
