import roundFloat from '../../../src/js/utils/round-float.js';

test('should round a number', function(){
  ok(roundFloat(1.01) === 1);
  ok(roundFloat(1.5) === 2);
  ok(roundFloat(1.55, 2) === 1.55);
  ok(roundFloat(10.551, 2) === 10.55);
});
