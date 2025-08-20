const QUnit = require('qunit');
const plugin = require('../../build/jsdoc-typeof-plugin.js');
const { handlers } = plugin;

QUnit.module('build/jsdoc-typeof-plugin', () => {

  QUnit.test('ReDos attack', assert => {
    const evt = { comment: '{'.repeat(100000) + 't' };
    const t0 = performance.now();

    handlers.jsdocCommentFound(evt);
    const dt = performance.now() - t0;

    assert.ok(dt < 5000, `expected < 5000ms, got ${dt.toFixed(1)}ms`);
  });

});
