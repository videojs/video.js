import toTitleCase from '../../../src/js/utils/to-title-case.js';

q.module('to-title-case');

test('should make a string start with an uppercase letter', function(){
  var foo = toTitleCase('bar');
  ok(foo === 'Bar');
});
