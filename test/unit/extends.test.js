import extendsFn from '../../src/js/extends.js';

q.module('extends.js');

test('should add implicit parent constructor call', function(){
  var superCalled = false;
  var Parent = function() {
    superCalled = true;
  };
  var Child = extendsFn(Parent, {
      foo: 'bar'
  });
  var child = new Child();
  ok(superCalled, 'super constructor called');
  ok(child.foo, 'child properties set');
});
