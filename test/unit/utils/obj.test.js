/* eslint-env qunit */
import sinon from 'sinon';
import * as Obj from '../../../src/js/utils/obj';

QUnit.module('utils/obj');

class Foo {
  constructor() {}
  toString() {
    return 'I am a Foo!';
  }
}

const passFail = (assert, fn, descriptor, passes, failures) => {
  Object.keys(passes).forEach(key => {
    assert.ok(fn(passes[key]), `${key} IS ${descriptor}`);
  });

  Object.keys(failures).forEach(key => {
    assert.notOk(fn(failures[key]), `${key} IS NOT ${descriptor}`);
  });
};

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

QUnit.test('isObject', function(assert) {
  passFail(assert, Obj.isObject, 'an object', {
    'plain object': {},
    'constructed object': new Foo(),
    'array': [],
    'regex': new RegExp('.'),
    'date': new Date()
  }, {
    null: null,
    function() {},
    boolean: true,
    number: 1,
    string: 'xyz'
  });
});

QUnit.test('isPlain', function(assert) {
  passFail(assert, Obj.isPlain, 'a plain object', {
    'plain object': {}
  }, {
    'constructed object': new Foo(),
    'null': null,
    'array': [],
    'function'() {},
    'regex': new RegExp('.'),
    'date': new Date(),
    'boolean': true,
    'number': 1,
    'string': 'xyz'
  });
});

QUnit.module('utils/obj.assign', function() {
  const assignTests = ['mocked'];

  // we only run "normal" tests where Object.assign is used when
  // Object.assign is supported
  if (Object.assign) {
    assignTests.push('unmocked');
  }

  assignTests.forEach(function(k) {
    QUnit.module(`with ${k} Object.assign`, {
      before() {
        if (k === 'mocked') {
          this.oldObjectAssign = Object.assign;
          Object.assign = null;
        }
      },
      after() {
        if (this.oldObjectAssign) {
          Object.assign = this.oldObjectAssign;
        }
        this.oldObjectAssign = null;
      }
    });

    QUnit.test('override object', function(assert) {
      const foo = {foo: 'yellow'};

      assert.deepEqual(Obj.assign(foo, {foo: 'blue'}), {foo: 'blue'}, 'Obj.assign should return overriden result');
      assert.deepEqual(foo, {foo: 'blue'}, 'foo should be modified directly');
    });

    QUnit.test('new object', function(assert) {
      const foo = {foo: 'yellow'};

      assert.deepEqual(Obj.assign({}, foo, {foo: 'blue'}), {foo: 'blue'}, 'Obj.assign should return result');
      assert.deepEqual(foo, {foo: 'yellow'}, 'foo should not be modified');
    });

    QUnit.test('empty override', function(assert) {
      const foo = {foo: 'yellow'};

      assert.deepEqual(Obj.assign(foo, {}), {foo: 'yellow'}, 'Obj.assign should return result');
      assert.deepEqual(foo, {foo: 'yellow'}, 'foo should not be modified');
    });

    QUnit.test('multiple override object', function(assert) {
      const foo = {foo: 'foo'};
      const bar = {foo: 'bar'};
      const baz = {foo: 'baz'};

      assert.deepEqual(Obj.assign(foo, bar, baz), baz, 'Obj.assign should return result');
      assert.deepEqual(foo, baz, 'foo should be overridden');
    });

    QUnit.test('additive properties', function(assert) {
      const foo = {};
      const expected = {one: 1, two: 2, three: 3};

      assert.deepEqual(Obj.assign(foo, {one: 1}, {two: 2}, {three: 3}), expected, 'Obj.assign should return result');
      assert.deepEqual(foo, expected, 'foo should be equal to result');
    });

    QUnit.test('deep override', function(assert) {
      const foo = {
        foo: {
          bar: {
            baz: 'buzz'
          }
        },
        blue: [55, 56],
        red: 'nope'
      };

      const baz = {
        foo: {
          bar: {
            baz: 'red'
          }
        },
        blue: [57]
      };

      const expected = {
        foo: {
          bar: {
            baz: 'red'
          }
        },
        blue: [57],
        red: 'nope'
      };

      assert.deepEqual(Obj.assign(foo, baz), expected, 'Obj.assign should return result');
      assert.deepEqual(foo, expected, 'foo is overridden');
    });

    QUnit.test('negative tests', function(assert) {
      const expected = {foo: 11};

      assert.deepEqual(Obj.assign({}, expected, undefined), expected, 'assign should undefined');
      assert.deepEqual(Obj.assign({}, expected, null), expected, 'assign should ignore null');
      assert.deepEqual(Obj.assign({}, expected, []), expected, 'assign should ignore Array');
      assert.deepEqual(Obj.assign({}, expected, ''), expected, 'assign should ignore string');
      assert.deepEqual(Obj.assign({}, expected, 11), expected, 'assign should ignore number');
      assert.deepEqual(Obj.assign({}, expected, new RegExp()), expected, 'assign should ignore RegExp');
      assert.deepEqual(Obj.assign({}, expected, new Date()), expected, 'assign should ignore Date');
      assert.deepEqual(Obj.assign({}, expected, true), expected, 'assign should ignore boolean');
      assert.deepEqual(Obj.assign({}, expected, () => {}), expected, 'assign should ignore function');
    });
  });
});

