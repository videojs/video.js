/* eslint-env qunit */
import formatTime from '../../../src/js/utils/format-time.js';

QUnit.module('format-time');

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
