/* eslint-env qunit */
import extendFn from '../../src/js/extend.js';

QUnit.module('extend.js');

QUnit.test('should add implicit parent constructor call', function(assert) {
  let superCalled = false;
  const Parent = function() {
    superCalled = true;
  };
  const Child = extendFn(Parent, {
    foo: 'bar'
  });
  const child = new Child();

  assert.ok(superCalled, 'super constructor called');
  assert.ok(child.foo, 'child properties set');
});
