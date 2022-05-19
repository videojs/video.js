/* eslint-env qunit */
import * as Num from '../../../src/js/utils/num';

QUnit.module('utils/num', function() {

  QUnit.module('clamp');

  QUnit.test('keep a number between min/max values', function(assert) {
    assert.expect(5);
    assert.strictEqual(Num.clamp(5, 1, 10), 5);
    assert.strictEqual(Num.clamp(5, 1, 5), 5);
    assert.strictEqual(Num.clamp(5, 1, 2), 2);
    assert.strictEqual(Num.clamp(-1, 1, 10), 1);
    assert.strictEqual(Num.clamp(NaN, 1, 10), 1);
  });
});
