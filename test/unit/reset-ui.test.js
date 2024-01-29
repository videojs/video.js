/* eslint-env qunit */
import TestHelpers from './test-helpers.js';
import {createTimeRanges} from '../../src/js/utils/time.js';
import sinon from 'sinon';
QUnit.module('player reset-ui');

QUnit.test('Calling resetProgressBar should reset the components displaying time related values', function(assert) {
  const clock = sinon.useFakeTimers();
  const player = TestHelpers.makePlayer({controls: true});

  clock.tick(1000);
  player.trigger('ready');
  player.buffered = function() {
    return createTimeRanges(0, 5);
  };
  player.duration(40);
  player.currentTime(20);

  const {
    currentTimeDisplay,
    durationDisplay,
    remainingTimeDisplay,
    progressControl: {
      seekBar
    }
  } = player.controlBar;

  clock.tick(30);

  player.trigger('timeupdate');
  player.trigger('progress');

  clock.tick(30);

  // Current time display
  assert.equal(currentTimeDisplay.textNode_.textContent, '0:20', 'current time display is 0:20');
  // Duration display
  assert.equal(durationDisplay.textNode_.textContent, '0:40', 'duration display is 0:40');
  // Remaining time display
  assert.equal(remainingTimeDisplay.textNode_.textContent, '0:20', 'remaining time display is 0:20');
  // Seek bar
  assert.equal(seekBar.getProgress(), '0.5', 'seek bar progress is 0.5');
  assert.equal(seekBar.getAttribute('aria-valuetext'), '0:20 of 0:40', 'seek bar progress holder aria value text is 0:20 of 0:40');
  assert.equal(seekBar.getAttribute('aria-valuenow'), '50.00', 'seek bar progress holder aria value now is 50.00');
  // Load progress
  assert.equal(seekBar.loadProgressBar.el().textContent, 'Loaded: 12.50%', 'load progress bar textContent is Loaded: 12.50%');
  assert.equal(seekBar.loadProgressBar.el().style.width, '12.5%', 'load progress bar width is 12.5%');
  // Play progress
  assert.equal(seekBar.playProgressBar.el().textContent, '0:20', 'player progress bar textContent is 0:20');
  assert.equal(seekBar.playProgressBar.el().style.width, '50%', 'player progress bar width is 50%');
  assert.equal(seekBar.playProgressBar.timeTooltip.el().textContent, '0:20', 'player progress bar time tooltip is 0:20');

  // Do reset
  player.resetProgressBar_();
  // Allows to have a duration state similar to player.reset() by combining the durationchange
  player.duration(NaN);
  player.trigger('durationchange');
  clock.tick(30);

  const calculateDistance = sinon.spy(seekBar, 'calculateDistance');

  // Simulate a mouse move
  seekBar.handleMouseMove({ offsetX: 1 });

  assert.equal(player.currentTime(), 0, 'player current time is 0');

  // Current time display
  assert.equal(currentTimeDisplay.textNode_.textContent, '0:00', 'current time display is 0:00');
  // Duration display
  assert.equal(durationDisplay.textNode_.textContent, '-:-', 'duration display is -:-');
  // Remaining time display
  assert.equal(remainingTimeDisplay.textNode_.textContent, '-:-', 'remaining time display is -:-');
  // Seek bar
  assert.equal(seekBar.getProgress(), '0', 'seek bar progress is 0');
  assert.equal(seekBar.getAttribute('aria-valuetext'), '0:00 of -:-', 'seek bar progress holder aria value text is 0:00 of -:-');
  assert.equal(seekBar.getAttribute('aria-valuenow'), '0.00', 'seek bar progress holder aria value now is 0.00');
  assert.ok(!calculateDistance.called, 'calculateDistance was not called');
  // Load progress
  assert.equal(seekBar.loadProgressBar.el().textContent, 'Loaded: 0.00%', 'load progress bar textContent is Loaded: 0.00%');
  assert.equal(seekBar.loadProgressBar.el().style.width, '0%', 'load progress bar width is 0%');
  // Play progress
  assert.equal(seekBar.playProgressBar.el().textContent, '0:00', 'player progress bar textContent is 0:00');
  assert.equal(seekBar.playProgressBar.el().style.width, '0%', 'player progress bar width is 0%');
  assert.equal(seekBar.playProgressBar.timeTooltip.el().textContent, '0:00', 'player progress bar time tooltip is 0:00');

  clock.restore();
  calculateDistance.restore();
  player.dispose();
});

QUnit.test('Calling resetProgressBar_ player method when no durationDisplay or remainingTimeDisplay controls exist', function(assert) {
  const player = TestHelpers.makePlayer({
    children: {
      controlBar: {}
    },
    controlBar: {
      children: {
        playToggle: {}
      }
    }
  });

  player.currentTime(20);
  player.resetProgressBar_();

  assert.equal(
    player.currentTime(), 0,
    'player current time is 0'
  );
  player.dispose();
});

QUnit.test('Calling resetPlaybackRate player method should place play rate at 1x', function(assert) {
  const player = TestHelpers.makePlayer({techOrder: ['html5']});

  player.playbackRate(2);
  player.handleTechRateChange_();
  player.resetPlaybackRate_();
  const defaultRate = player.defaultPlaybackRate();

  assert.equal(
    player.controlBar.playbackRateMenuButton.labelEl_.textContent, defaultRate + 'x',
    'Playback rate is the default one on the UI'
  );
  assert.equal(
    player.playbackRate(), defaultRate,
    'Playback rate is the default one on the player object'
  );
  player.dispose();
});

QUnit.test('Calling resetVolumeBar player method should reset volume bar', function(assert) {
  const player = TestHelpers.makePlayer({ techOrder: ['html5'] });

  player.volume(0.5);

  player.trigger('volumechange');

  assert.equal(player.controlBar.volumePanel.volumeControl.volumeBar.el_.getAttribute('aria-valuenow'), 50, 'UI value of VolumeBar is 50');

  player.resetVolumeBar_();

  assert.equal(player.controlBar.volumePanel.volumeControl.volumeBar.el_.getAttribute('aria-valuenow'), 100, 'UI value of VolumeBar is 100');

  player.dispose();
});

QUnit.test('Calling reset player method should reset both error display and player error', function(assert) {
  const player = TestHelpers.makePlayer({techOrder: ['html5']});

  player.error('ERROR');

  assert.notOk(player.errorDisplay.hasClass('vjs-hidden'), 'ErrorDisplay is displayed if there is an error');
  assert.strictEqual(player.error().message, 'ERROR', 'player error has content');

  player.reset();

  assert.ok(player.errorDisplay.hasClass('vjs-hidden'), 'ErrorDisplay is not displayed if there is no error');
  assert.strictEqual(player.error(), null, 'player error has content');

  player.dispose();
});

QUnit.test('Calling reset player method should reset title bar', function(assert) {
  const player = TestHelpers.makePlayer();

  player.titleBar.update({
    title: 'Title',
    description: 'Description'
  });

  assert.notOk(player.titleBar.hasClass('vjs-hidden'), 'TitleBar is visible if not empty');
  assert.strictEqual(player.titleBar.els.title.textContent, 'Title', 'TitleBar title element has content');
  assert.strictEqual(player.titleBar.els.description.textContent, 'Description', 'TitleBar description element has content');

  player.reset();

  assert.ok(player.titleBar.hasClass('vjs-hidden'), 'TitleBar is not visible if empty');
  assert.strictEqual(player.titleBar.els.title.textContent, '', 'TitleBar title element has no content');
  assert.strictEqual(player.titleBar.els.description.textContent, '', 'TitleBar description element has no content');

  player.dispose();
});
