/* eslint-env qunit */
import extend from '../../src/js/extend.js';

QUnit.module('extend.js');

QUnit.test('should add implicit parent constructor call', function(assert) {
  let superCalled = false;
  const Parent = function() {
    superCalled = true;
  };
  const Child = extend(Parent, {
    foo: 'bar'
  });
  const child = new Child();

  assert.ok(superCalled, 'super constructor called');
  assert.ok(child.foo, 'child properties set');
});

QUnit.test('should have a super_ pointer', function(assert) {
  const Parent = function() {};
  const Child = extend(Parent, {
    foo: 'bar'
  });

  const child = new Child();

  assert.ok(child.foo, 'child properties set');
  assert.equal(child.constructor.super_, Parent, 'super_ is present and equal to the super class');
});
