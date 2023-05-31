/* eslint-env qunit */
import sinon from 'sinon';
import * as Obj from '../../../src/js/utils/obj';

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

QUnit.module('utils/obj', function() {

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

  QUnit.module('merge');

  QUnit.test('should merge objects', function(assert) {
    const ob1 = {
      a: true,
      b: { b1: true, b2: true, b3: true },
      c: true
    };

    const ob2 = {
      // override value
      a: false,
      // merge sub-option values
      b: { b1: true, b2: false, b4: true },
      // add new option
      d: true
    };

    const ob3 = Obj.merge(ob1, ob2);

    assert.deepEqual(ob3, {
      a: false,
      b: { b1: true, b2: false, b3: true, b4: true },
      c: true,
      d: true
    }, 'options objects merged correctly');
  });

  QUnit.test('should ignore non-objects', function(assert) {
    const obj = { a: 1 };

    assert.deepEqual(Obj.merge(obj, true), obj, 'ignored non-object input');
  });

  QUnit.module('defineLazyProperty');

  QUnit.test('should define a "lazy" property', function(assert) {
    assert.expect(12);

    const obj = {a: 1};
    const getValue = sinon.spy(() => {
      return 2;
    });

    Obj.defineLazyProperty(obj, 'b', getValue);

    let descriptor = Object.getOwnPropertyDescriptor(obj, 'b');

    assert.ok(getValue.notCalled, 'getValue function was not called');
    assert.strictEqual(typeof descriptor.get, 'function', 'descriptor has a getter');
    assert.strictEqual(typeof descriptor.set, 'function', 'descriptor has a setter');
    assert.strictEqual(typeof descriptor.value, 'undefined', 'descriptor has no value');

    let b = obj.b;

    descriptor = Object.getOwnPropertyDescriptor(obj, 'b');

    assert.ok(getValue.calledOnce, 'getValue function was not called');
    assert.strictEqual(b, 2, 'the value was retrieved correctly');
    assert.strictEqual(typeof descriptor.get, 'undefined', 'descriptor has no getter');
    assert.strictEqual(typeof descriptor.set, 'undefined', 'descriptor has no setter');
    assert.strictEqual(descriptor.value, 2, 'descriptor has a value');

    b = obj.b;
    descriptor = Object.getOwnPropertyDescriptor(obj, 'b');

    assert.ok(getValue.calledOnce, 'getValue function was still only called once');
    assert.strictEqual(b, 2, 'the value was retrieved correctly');
    assert.strictEqual(descriptor.value, 2, 'descriptor has a value');
  });

  QUnit.module('values', () => {
    QUnit.test('returns an array of values for a given object', (assert) => {
      const source = { a: 1, b: 2, c: 3 };
      const expectedResult = [1, 2, 3];

      assert.deepEqual(Obj.values(source), expectedResult, 'All values are extracted correctly');
    });

    QUnit.test('returns an empty array for an empty object', (assert) => {
      const source = {};
      const expectedResult = [];

      assert.deepEqual(Obj.values(source), expectedResult, 'Empty array is returned for an empty object');
    });

    QUnit.test('ignores prototype properties', (assert) => {
      const source = Object.create({ a: 1 });

      source.b = 2;

      const expectedResult = [2];

      assert.deepEqual(Obj.values(source), expectedResult, 'Only own properties are included in the result');
    });
  });
});
