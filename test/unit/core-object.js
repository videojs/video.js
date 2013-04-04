module('Core Object');

test('should verify CoreObject extension', function(){
  var TestObject = vjs.CoreObject.extend({
    init: function(initOptions){
      this['a'] = initOptions['a'];
    },
    testFn: function(){
      return true;
    }
  });
  var instance = new TestObject({ 'a': true });

  ok(instance instanceof TestObject, 'New instance is instance of TestObject');
  ok(instance instanceof vjs.CoreObject, 'New instance is instance of CoreObject');
  ok(instance['a'], 'Init options are passed to init');
  ok(instance.testFn(), 'Additional methods are applied to TestObject prototype');

  // Two levels of inheritance
  var TestChild = TestObject.extend({
    init: function(initOptions){
      TestObject.call(this, initOptions);
      // TestObject.prototype.init.call(this, initOptions);
      this['b'] = initOptions['b'];
    },
    testFn: function(){
      return false;
    }
  });

  var childInstance = new TestChild({ 'a': true, 'b': true });

  ok(childInstance instanceof TestChild, 'New instance is instance of TestChild');
  ok(childInstance instanceof TestObject, 'New instance is instance of TestObject');
  ok(childInstance instanceof vjs.CoreObject, 'New instance is instance of CoreObject');
  ok(childInstance['b'], 'Init options are passed to init');
  ok(childInstance['a'], 'Init options are passed to super init');
  ok(childInstance.testFn() === false, 'Methods can be overridden by extend');
  ok(TestObject.prototype.testFn() === true, 'Prototype of parent not overridden');
});

test('should verify CoreObject create function', function(){
  var TestObject = vjs.CoreObject.extend({
    init: function(initOptions){
      this['a'] = initOptions['a'];
    },
    testFn: function(){
      return true;
    }
  });

  var instance = TestObject.create({ 'a': true });

  ok(instance instanceof TestObject, 'New instance is instance of TestObject');
  ok(instance instanceof vjs.CoreObject, 'New instance is instance of CoreObject');
  ok(instance['a'], 'Init options are passed to init');
  ok(instance.testFn(), 'Additional methods are applied to TestObject prototype');
});
