/* eslint-env qunit */
import TestHelpers from './test-helpers.js';
QUnit.module('player reset-ui');

QUnit.test('Calling resetProgressBar player method should place progress bar at 0% width', function(assert) {
  const player = TestHelpers.makePlayer();

  player.currentTime(20);
  player.trigger('timeupdate');
  player.resetProgressBar_();
  assert.equal(
    player.controlBar.progressControl.seekBar.playProgressBar.el().offsetWidth, 0,
    'progress bar is reset to width 0%'
  );
  assert.equal(
    player.currentTime(), 0,
    'player current time is 0'
  );
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
