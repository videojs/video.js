/* eslint-env qunit */
import VolumeControl from '../../src/js/control-bar/volume-control/volume-control.js';
import MuteToggle from '../../src/js/control-bar/mute-toggle.js';
import PlaybackRateMenuButton from '../../src/js/control-bar/playback-rate-menu/playback-rate-menu-button.js';
import Slider from '../../src/js/slider/slider.js';
import FullscreenToggle from '../../src/js/control-bar/fullscreen-toggle.js';
import TestHelpers from './test-helpers.js';
import document from 'global/document';

QUnit.module('Controls');

QUnit.test('should hide volume control if it\'s not supported', function(assert) {
  assert.expect(2);

  const player = TestHelpers.makePlayer();

  player.tech_.featuresVolumeControl = false;

  const volumeControl = new VolumeControl(player);
  const muteToggle = new MuteToggle(player);

  assert.ok(volumeControl.hasClass('vjs-hidden'), 'volumeControl is not hidden');
  assert.ok(muteToggle.hasClass('vjs-hidden'), 'muteToggle is not hidden');
  player.dispose();
});

QUnit.test('should test and toggle volume control on `loadstart`', function(assert) {
  const player = TestHelpers.makePlayer();

  player.tech_.featuresVolumeControl = true;

  const volumeControl = new VolumeControl(player);
  const muteToggle = new MuteToggle(player);

  assert.equal(volumeControl.hasClass('vjs-hidden'), false, 'volumeControl is hidden initially');
  assert.equal(muteToggle.hasClass('vjs-hidden'), false, 'muteToggle is hidden initially');

  player.tech_.featuresVolumeControl = false;
  player.trigger('loadstart');

  assert.equal(volumeControl.hasClass('vjs-hidden'), true, 'volumeControl does not hide itself');
  assert.equal(muteToggle.hasClass('vjs-hidden'), true, 'muteToggle does not hide itself');

  player.tech_.featuresVolumeControl = true;
  player.trigger('loadstart');

  assert.equal(volumeControl.hasClass('vjs-hidden'), false, 'volumeControl does not show itself');
  assert.equal(muteToggle.hasClass('vjs-hidden'), false, 'muteToggle does not show itself');
});

QUnit.test('calculateDistance should use changedTouches, if available', function(assert) {
  const player = TestHelpers.makePlayer();

  player.tech_.featuresVolumeControl = true;

  const slider = new Slider(player);

  document.body.appendChild(slider.el_);
  slider.el_.style.position = 'absolute';
  slider.el_.style.width = '200px';
  slider.el_.style.left = '0px';

  const event = {
    pageX: 10,
    changedTouches: [{
      pageX: 100
    }]
  };

  assert.equal(slider.calculateDistance(event), 0.5, 'we should have touched exactly in the center, so, the ratio should be half');
});

QUnit.test('should hide playback rate control if it\'s not supported', function(assert) {
  assert.expect(1);

  const player = TestHelpers.makePlayer();
  const playbackRate = new PlaybackRateMenuButton(player);

  assert.ok(playbackRate.el().className.indexOf('vjs-hidden') >= 0, 'playbackRate is not hidden');
  player.dispose();
});

QUnit.test('Fullscreen control text should be correct when fullscreenchange is triggered', function() {
  const player = TestHelpers.makePlayer();
  const fullscreentoggle = new FullscreenToggle(player);

  player.isFullscreen(true);
  player.trigger('fullscreenchange');
  QUnit.equal(fullscreentoggle.controlText(), 'Non-Fullscreen', 'Control Text is correct while switching to fullscreen mode');
  player.isFullscreen(false);
  player.trigger('fullscreenchange');
  QUnit.equal(fullscreentoggle.controlText(), 'Fullscreen', 'Control Text is correct while switching back to normal mode');
  player.dispose();
});
