import formatTime from '../../../src/js/utils/format-time.js';
import window from 'global/window';

q.module('format-time');

test('should format time as a string', function(){
  ok(formatTime(1) === '0:01');
  ok(formatTime(10) === '0:10');
  ok(formatTime(60) === '1:00');
  ok(formatTime(600) === '10:00');
  ok(formatTime(3600) === '1:00:00');
  ok(formatTime(36000) === '10:00:00');
  ok(formatTime(360000) === '100:00:00');

  // Using guide should provide extra leading zeros
  ok(formatTime(1,1) === '0:01');
  ok(formatTime(1,10) === '0:01');
  ok(formatTime(1,60) === '0:01');
  ok(formatTime(1,600) === '00:01');
  ok(formatTime(1,3600) === '0:00:01');
  // Don't do extra leading zeros for hours
  ok(formatTime(1,36000) === '0:00:01');
  ok(formatTime(1,360000) === '0:00:01');

  // Do not display negative time
  ok(formatTime(-1) === '0:00');
  ok(formatTime(-1,3600) === '0:00:00');
});

test('should format invalid times as dashes', function(){
  equal(formatTime(Infinity, 90), '-:-');
  equal(formatTime(NaN), '-:-');
  // equal(formatTime(NaN, 216000), '-:--:--');
  equal(formatTime(10, Infinity), '0:00:10');
  equal(formatTime(90, NaN), '1:30');
});

test('should format time as a string with frames when supplied a custom function', function(){
  // Set custom formatting function
  window.videojs = {
    formatTime: (time) => {
      const fps = 30;
      const hours = parseInt(time / 3600);
      const mins = parseInt((time % 3600) / 60);
      const secs = parseInt(time % 60);
      const frames = Math.floor((time % 1) * fps);

      return `${hours}:${mins}:${secs}:${frames}`;
    }
  };

  ok(formatTime(1.5) === '0:0:1:15');
  ok(formatTime(10.99) === '0:0:10:29');
  ok(formatTime(60.1) === '0:1:0:3');
  ok(formatTime(600.33) === '0:10:0:9');
  ok(formatTime(3600) === '1:0:0:0');
  ok(formatTime(36000.2) === '10:0:0:5');

  // Restore to default value
  window.videojs = undefined;
});
