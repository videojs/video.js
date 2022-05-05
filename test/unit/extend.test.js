/* eslint-env qunit */
import extend from '../../src/js/extend.js';

QUnit.module('extend.js');

QUnit.test('should add implicit parent constructor call', function(assert) {
  assert.expect(4);

  let superCalled = false;

  [
    function() {
      superCalled = true;
    },
    class Parent {
      constructor() {
        superCalled = true;
      }
    }
  ].forEach(Parent => {
    const Child = extend(Parent, {
      foo: 'bar'
    });
    const child = new Child();

    assert.ok(superCalled, 'super constructor called');
    assert.ok(child.foo, 'child properties set');

    superCalled = false;
  });
});

QUnit.test('should have a super_ pointer', function(assert) {
  assert.expect(4);

  [function() {}, class Parent {}].forEach(Parent => {
    const Child = extend(Parent, {
      foo: 'bar'
    });
    const child = new Child();

    assert.ok(child.foo, 'child properties set');
    assert.equal(child.constructor.super_, Parent, 'super_ is present and equal to the super class');
  });
});

QUnit.test('sub class is an ES6 class if the super class is', function(assert) {
  class Parent {}

  const Child = extend(Parent, {
    foo: 'bar'
  });

  assert.ok(/^class/.test(Child.toString()), 'sub class is native es6 class');
});
