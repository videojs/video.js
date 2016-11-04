/* eslint-env qunit */
import sinon from 'sinon';
import * as Obj from '../../../src/js/utils/obj';

QUnit.module('utils/obj');

QUnit.test('each', function(assert) {
  const spy = sinon.spy();

  Obj.each({
    a: 1,
    b: 'foo',
    c: null
  }, spy);

  assert.strictEqual(spy.callCount, 3);
  assert.ok(spy.calledWith(1, 'a'));
  assert.ok(spy.calledWith('foo', 'b'));
  assert.ok(spy.calledWith(null, 'c'));

  Obj.each({}, spy);
  assert.strictEqual(spy.callCount, 3, 'an empty object was not iterated over');
});

QUnit.test('reduce', function(assert) {
  const first = Obj.reduce({
    a: 1,
    b: 2,
    c: 3,
    d: 4
  }, (accum, value) => accum + value);

  assert.strictEqual(first, 10);

  const second = Obj.reduce({
    a: 1,
    b: 2,
    c: 3,
    d: 4
  }, (accum, value) => accum + value, 10);

  assert.strictEqual(second, 20);

  const third = Obj.reduce({
    a: 1,
    b: 2,
    c: 3,
    d: 4
  }, (accum, value, key) => {
    accum[key] = 0 - value;
    return accum;
  }, {});

  assert.strictEqual(third.a, -1);
  assert.strictEqual(third.b, -2);
  assert.strictEqual(third.c, -3);
  assert.strictEqual(third.d, -4);
});
