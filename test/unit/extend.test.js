import extendFn from '../../src/js/extend.js';

q.module('extend.js');

test('should add implicit parent constructor call', function(){
  var superCalled = false;
  var Parent = function() {
    superCalled = true;
  };
  var Child = extendFn(Parent, {
      foo: 'bar'
  });
  var child = new Child();
  ok(superCalled, 'super constructor called');
  ok(child.foo, 'child properties set');
});
