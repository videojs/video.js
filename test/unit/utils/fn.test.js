import * as Fn from '../../../src/js/utils/fn.js';

q.module('fn');

test('should add context to a function', function(){
  var newContext = { test: 'obj'};
  var asdf = function(){
    ok(this === newContext);
  };
  var fdsa = Fn.bind(newContext, asdf);

  fdsa();
});
