module('util');

test('should merge options objects', function(){
  var ob1, ob2, ob3;

  ob1 = {
    a: true,
    b: { b1: true, b2: true, b3: true },
    c: true
  };

  ob2 = {
    // override value
    a: false,
    // merge sub-option values
    b: { b1: true, b2: false, b4: true },
    // add new option
    d: true
  };

  ob3 = vjs.util.mergeOptions(ob1, ob2);

  deepEqual(ob3, {
    a: false,
    b: { b1: true, b2: false, b3: true, b4: true },
    c: true,
    d: true
  }, 'options objects merged correctly');
});

test('should add the value to the languages object', function() {
  var code, data, result;

  code = 'es';
  data = {'Hello': 'Hola'};
  result = vjs.util.addLanguage(code, data);

  ok(vjs.options.languages[code], 'should exist');
  equal(vjs.options.languages[code], data, 'should match');
  deepEqual(result, vjs.options.languages[code], 'should also match');
});