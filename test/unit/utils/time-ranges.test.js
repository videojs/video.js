import { createTimeRange } from '../../../src/js/utils/time-ranges.js';

q.module('time-ranges');

test('should create a fake timerange', function(){
  var tr = createTimeRange(0, 10);
  ok(tr.start() === 0);
  ok(tr.end() === 10);
});
