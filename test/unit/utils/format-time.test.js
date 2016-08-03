/* eslint-env qunit */
import formatTime from '../../../src/js/utils/format-time.js';

QUnit.module('format-time');

QUnit.test('should format time as a string', function() {
  QUnit.ok(formatTime(1) === '0:01');
  QUnit.ok(formatTime(10) === '0:10');
  QUnit.ok(formatTime(60) === '1:00');
  QUnit.ok(formatTime(600) === '10:00');
  QUnit.ok(formatTime(3600) === '1:00:00');
  QUnit.ok(formatTime(36000) === '10:00:00');
  QUnit.ok(formatTime(360000) === '100:00:00');

  // Using guide should provide extra leading zeros
  QUnit.ok(formatTime(1, 1) === '0:01');
  QUnit.ok(formatTime(1, 10) === '0:01');
  QUnit.ok(formatTime(1, 60) === '0:01');
  QUnit.ok(formatTime(1, 600) === '00:01');
  QUnit.ok(formatTime(1, 3600) === '0:00:01');
  // Don't do extra leading zeros for hours
  QUnit.ok(formatTime(1, 36000) === '0:00:01');
  QUnit.ok(formatTime(1, 360000) === '0:00:01');

  // Do not display negative time
  QUnit.ok(formatTime(-1) === '0:00');
  QUnit.ok(formatTime(-1, 3600) === '0:00:00');
});

QUnit.test('should format invalid times as dashes', function() {
  QUnit.equal(formatTime(Infinity, 90), '-:-');
  QUnit.equal(formatTime(NaN), '-:-');
  QUnit.equal(formatTime(10, Infinity), '0:00:10');
  QUnit.equal(formatTime(90, NaN), '1:30');
});
