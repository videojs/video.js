module('Controls');

test('should hide volume control if it\'s not supported', function(){
  expect(2);

  var noop, player, volumeControl, muteToggle;
  noop = function(){};
  player = {
    id: noop,
    on: noop,
    ready: noop,
    tech: {
      features: {
        'volumeControl': false
      }
    },
    volume: function(){},
    muted: function(){},
    reportUserActivity: function(){}
  };

  volumeControl = new vjs.VolumeControl(player);
  muteToggle = new vjs.MuteToggle(player);

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
      listeners.push(callback);
    },
    ready: noop,
    volume: function(){
      return 1;
    },
    muted: function(){
      return false;
    },
    tech: {
      features: {
        'volumeControl': true
      }
    },
    reportUserActivity: function(){}
  };

  volumeControl = new vjs.VolumeControl(player);
  muteToggle = new vjs.MuteToggle(player);

  ok(volumeControl.el().className.indexOf('vjs-hidden') < 0,
     'volumeControl is hidden initially');
  ok(muteToggle.el().className.indexOf('vjs-hidden') < 0,
     'muteToggle is hidden initially');

  player.tech.features['volumeControl'] = false;
  for (i = 0; i < listeners.length; i++) {
    listeners[i]();
  }

  ok(volumeControl.el().className.indexOf('vjs-hidden') >= 0,
     'volumeControl does not hide itself');
  ok(muteToggle.el().className.indexOf('vjs-hidden') >= 0,
     'muteToggle does not hide itself');

  player.tech.features['volumeControl'] = true;
  for (i = 0; i < listeners.length; i++) {
    listeners[i]();
  }

  ok(volumeControl.el().className.indexOf('vjs-hidden') < 0,
     'volumeControl does not show itself');
  ok(muteToggle.el().className.indexOf('vjs-hidden') < 0,
     'muteToggle does not show itself');
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
  slider = new vjs.Slider(player);
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

  var player = PlayerTest.makePlayer();
  var playbackRate = new vjs.PlaybackRateMenuButton(player);

  ok(playbackRate.el().className.indexOf('vjs-hidden') >= 0, 'playbackRate is not hidden');
});
