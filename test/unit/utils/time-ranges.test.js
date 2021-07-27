/* eslint-env qunit */
import { createTimeRanges, createTimeRange } from '../../../src/js/utils/time-ranges.js';
import window from 'global/window';

QUnit.module('time-ranges');

QUnit.test('should export the deprecated createTimeRange function', function(assert) {
  assert.equal(
    createTimeRange,
    createTimeRanges,
    'createTimeRange is an alias to createTimeRanges'
  );
});

QUnit.test('should create a fake single timerange', function(assert) {
  const tr = createTimeRanges(0, 10);

  assert.equal(tr.length, 1, 'length should be 1');
  assert.equal(
    tr.start(0),
    0,
    'works if start is called with valid index'
  );
  assert.equal(
    tr.end(0),
    10,
    'works if end is called with with valid index'
  );
  assert.throws(
    ()=>tr.start(1),
    /Failed to execute 'start'/,
    'fails if start is called with an invalid index'
  );
  assert.throws(
    ()=>tr.end(1),
    /Failed to execute 'end'/,
    'fails if end is called with with an invalid index'
  );
});

QUnit.test('should create a fake multiple timerange', function(assert) {
  const tr = createTimeRanges([
    [0, 10],
    [11, 20]
  ]);

  assert.equal(tr.length, 2, 'length should equal 2');
  assert.equal(tr.start(1), 11, 'works if start is called with valid index');
  assert.equal(tr.end(1), 20, 'works if end is called with with valid index');
  assert.throws(
    ()=>tr.start(-1),
    /Failed to execute 'start'/,
    'fails if start is called with an invalid index'
  );
  assert.throws(
    ()=>tr.end(-1),
    /Failed to execute 'end'/,
    'fails if end is called with with an invalid index'
  );
});

QUnit.test('should throw without being given an index', function(assert) {
  const tr = createTimeRanges([
    [0, 10],
    [11, 20]
  ]);

  assert.throws(
    () => tr.start(),
    /Failed to execute 'start'/,
    'start throws if no index is given'
  );

  assert.throws(
    () => tr.end(),
    /Failed to execute 'end'/,
    'end throws if no index is given'
  );
});

let testOrSkip = 'skip';

if (window.Symbol && window.Symbol.iterator) {
  testOrSkip = 'test';
}
QUnit[testOrSkip]('Array.from works on our time ranges object', function(assert) {
  const trRepresentation = [
    [0, 10],
    [20, 30]
  ];
  let tr = createTimeRanges(trRepresentation);

  assert.deepEqual(Array.from(tr), trRepresentation, 'we got back what we put in');

  tr = createTimeRanges(0, 10);
  assert.deepEqual(Array.from(tr), [[0, 10]], 'we got back a ranges representation');
});
