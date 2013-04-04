module('Controls');

test('should hide volume control if it\'s not supported', function(){
  var noop, player, volumeControl, muteToggle;
  noop = function(){};
  player = {
    id: noop,
    on: noop,
    ready: noop,
    tech: {
      features: {
        volumeControl: false
      }
    }
  };
  volumeControl = new vjs.VolumeControl(player);
  muteToggle = new vjs.MuteToggle(player);

  ok(volumeControl.el().className.indexOf('vjs-hidden') >= 0, 'volumeControl is not hidden');
  ok(muteToggle.el().className.indexOf('vjs-hidden') >= 0, 'muteToggle is not hidden');
});

test('should test and toggle volume control on `loadstart`', function(){
  var noop, listeners, player, volumeControl, muteToggle;
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
        volumeControl: true
      }
    }
  };
  volumeControl = new vjs.VolumeControl(player);
  muteToggle = new vjs.MuteToggle(player);

  ok(volumeControl.el().className.indexOf('vjs-hidden') < 0,
     'volumeControl is hidden initially');
  ok(muteToggle.el().className.indexOf('vjs-hidden') < 0,
     'muteToggle is hidden initially');

  player.tech.features.volumeControl = false;
  listeners.forEach(function(listener) {
    listener();
  });

  ok(volumeControl.el().className.indexOf('vjs-hidden') >= 0,
     'volumeControl does not hide itself');
  ok(muteToggle.el().className.indexOf('vjs-hidden') >= 0,
     'muteToggle does not hide itself');

  player.tech.features.volumeControl = true;
  listeners.forEach(function(listener) {
    listener();
  });

  ok(volumeControl.el().className.indexOf('vjs-hidden') < 0,
     'volumeControl does not show itself');
  ok(muteToggle.el().className.indexOf('vjs-hidden') < 0,
     'muteToggle does not show itself');
});
