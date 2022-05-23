/* eslint-env qunit */
import { formatTime, setFormatTime, resetFormatTime, createTimeRanges, createTimeRange } from '../../../src/js/utils/time.js';
import window from 'global/window';

QUnit.module('utils/time', function() {

  QUnit.module('TimeRanges');

  QUnit.test('should export the deprecated createTimeRange function', function(assert) {
    assert.equal(
      createTimeRange,
      createTimeRanges,
      'createTimeRange is an alias to createTimeRanges'
    );
  });

  QUnit.test('should create a fake single TimeRanges object', function(assert) {
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

  QUnit.test('should create a fake multiple TimeRanges object', function(assert) {
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

  QUnit[testOrSkip]('Array.from works on our TimeRanges object', function(assert) {
    const trRepresentation = [
      [0, 10],
      [20, 30]
    ];
    let tr = createTimeRanges(trRepresentation);

    assert.deepEqual(Array.from(tr), trRepresentation, 'we got back what we put in');

    tr = createTimeRanges(0, 10);
    assert.deepEqual(Array.from(tr), [[0, 10]], 'we got back a ranges representation');
  });

  QUnit.module('formatTime', {
    afterEach: resetFormatTime()
  });

  QUnit.test('should format time as a string', function(assert) {
    assert.ok(formatTime(1) === '0:01');
    assert.ok(formatTime(10) === '0:10');
    assert.ok(formatTime(60) === '1:00');
    assert.ok(formatTime(600) === '10:00');
    assert.ok(formatTime(3600) === '1:00:00');
    assert.ok(formatTime(36000) === '10:00:00');
    assert.ok(formatTime(360000) === '100:00:00');

    // Using guide should provide extra leading zeros
    assert.ok(formatTime(1, 1) === '0:01');
    assert.ok(formatTime(1, 10) === '0:01');
    assert.ok(formatTime(1, 60) === '0:01');
    assert.ok(formatTime(1, 600) === '00:01');
    assert.ok(formatTime(1, 3600) === '0:00:01');
    // Don't do extra leading zeros for hours
    assert.ok(formatTime(1, 36000) === '0:00:01');
    assert.ok(formatTime(1, 360000) === '0:00:01');

    // Do not display negative time
    assert.ok(formatTime(-1) === '0:00');
    assert.ok(formatTime(-1, 3600) === '0:00:00');
  });

  QUnit.test('should format invalid times as dashes', function(assert) {
    assert.equal(formatTime(Infinity, 90), '-:-');
    assert.equal(formatTime(NaN), '-:-');
    assert.equal(formatTime(10, Infinity), '0:00:10');
    assert.equal(formatTime(90, NaN), '1:30');
  });

  QUnit.test('setFormatTime', function(assert) {
    setFormatTime((seconds, guide) => `custom:${seconds}:${guide}`);
    assert.equal(formatTime(1, 2), 'custom:1:2', 'it should replace the default formatTime implementation');
  });

  QUnit.test('resetFormatTime', function(assert) {
    setFormatTime((seconds, guide) => `custom:${seconds}:${guide}`);
    assert.equal(formatTime(1, 2), 'custom:1:2');
    resetFormatTime();
    assert.equal(formatTime(1), '0:01', 'it should reset formatTime to the default implementation');
  });
});
