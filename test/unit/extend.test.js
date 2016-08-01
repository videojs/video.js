/* eslint-env qunit */
import extendFn from '../../src/js/extend.js';

QUnit.module('extend.js');

QUnit.test('should add implicit parent constructor call', function() {
  let superCalled = false;
  const Parent = function() {
    superCalled = true;
  };
  const Child = extendFn(Parent, {
    foo: 'bar'
  });
  const child = new Child();

  QUnit.ok(superCalled, 'super constructor called');
  QUnit.ok(child.foo, 'child properties set');
});
