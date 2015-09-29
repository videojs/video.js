import VolumeControl from '../../src/js/control-bar/volume-control/volume-control.js';
import MuteToggle from '../../src/js/control-bar/mute-toggle.js';
import PlaybackRateMenuButton from '../../src/js/control-bar/playback-rate-menu/playback-rate-menu-button.js';
import Slider from '../../src/js/slider/slider.js';
import TestHelpers from './test-helpers.js';
import document from 'global/document';

q.module('Controls');

test('should hide volume control if it\'s not supported', function(){
  expect(2);

  var noop, player, volumeControl, muteToggle;
  noop = function(){};
  player = {
    id: noop,
    on: noop,
    ready: noop,
    tech_: {
      'featuresVolumeControl': false
    },
    volume: function(){},
    muted: function(){},
    reportUserActivity: function(){}
  };

  volumeControl = new VolumeControl(player);
  muteToggle = new MuteToggle(player);

  ok(volumeControl.el().className.indexOf('vjs-hidden') >= 0, 'volumeControl is not hidden');
  ok(muteToggle.el().className.indexOf('vjs-hidden') >= 0, 'muteToggle is not hidden');
});

test('should test and toggle volume control on `loadstart`', function(){
  var noop, listeners, player, volumeControl, muteToggle, i;
  noop = function(){};
  listeners = [];
  player = {
    id: noop,
    on: function(event, callback){
      // don't fire dispose listeners
      if (event !== 'dispose') {
        listeners.push(callback);
      }
    },
    ready: noop,
    volume: function(){
      return 1;
    },
    muted: function(){
      return false;
    },
    tech_: {
      'featuresVolumeControl': true
    },
    reportUserActivity: function(){}
  };

  volumeControl = new VolumeControl(player);
  muteToggle = new MuteToggle(player);

  equal(volumeControl.hasClass('vjs-hidden'), false, 'volumeControl is hidden initially');
  equal(muteToggle.hasClass('vjs-hidden'), false, 'muteToggle is hidden initially');

  player.tech_['featuresVolumeControl'] = false;
  for (i = 0; i < listeners.length; i++) {
    listeners[i]();
  }

  equal(volumeControl.hasClass('vjs-hidden'), true, 'volumeControl does not hide itself');
  equal(muteToggle.hasClass('vjs-hidden'), true, 'muteToggle does not hide itself');

  player.tech_['featuresVolumeControl'] = true;
  for (i = 0; i < listeners.length; i++) {
    listeners[i]();
  }

  equal(volumeControl.hasClass('vjs-hidden'), false, 'volumeControl does not show itself');
  equal(muteToggle.hasClass('vjs-hidden'), false, 'muteToggle does not show itself');
});

test('calculateDistance should use changedTouches, if available', function() {
  var noop, player, slider, event;
  noop = function(){};
  player = {
    id: noop,
    on: noop,
    ready: noop,
    reportUserActivity: noop
  };
  slider = new Slider(player);
  document.body.appendChild(slider.el_);
  slider.el_.style.position = 'absolute';
  slider.el_.style.width = '200px';
  slider.el_.style.left = '0px';

  event = {
    pageX: 10,
    changedTouches: [{
      pageX: 100
    }]
  };

  equal(slider.calculateDistance(event), 0.5, 'we should have touched exactly in the center, so, the ratio should be half');
});

test('should hide playback rate control if it\'s not supported', function(){
  expect(1);

  var player = TestHelpers.makePlayer();
  var playbackRate = new PlaybackRateMenuButton(player);

  ok(playbackRate.el().className.indexOf('vjs-hidden') >= 0, 'playbackRate is not hidden');
});
