import { createTimeRanges, createTimeRange } from '../../../src/js/utils/time-ranges.js';

q.module('time-ranges');

test('should export the deprecated createTimeRange function', function(){
  equal(createTimeRange, createTimeRanges, 'createTimeRange is an alias to createTimeRanges');
});

test('should create a fake single timerange', function(assert){
  var tr = createTimeRanges(0, 10);

  equal(tr.length, 1, 'length should be 1');
  equal(tr.start(0), 0, 'works if start is called with valid index');
  equal(tr.end(0), 10, 'works if end is called with with valid index');
  assert.throws(()=>tr.start(1), /Failed to execute 'start'/, 'fails if start is called with an invalid index');
  assert.throws(()=>tr.end(1), /Failed to execute 'end'/, 'fails if end is called with with an invalid index');
});

test('should create a fake multiple timerange', function(assert){
  var tr = createTimeRanges([
    [0, 10],
    [11, 20]
  ]);

  equal(tr.length, 2, 'length should equal 2');
  equal(tr.start(1), 11, 'works if start is called with valid index');
  equal(tr.end(1), 20, 'works if end is called with with valid index');
  assert.throws(()=>tr.start(-1), /Failed to execute 'start'/, 'fails if start is called with an invalid index');
  assert.throws(()=>tr.end(-1), /Failed to execute 'end'/, 'fails if end is called with with an invalid index');
});
