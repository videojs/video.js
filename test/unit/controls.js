module('Controls');

test('should hide volume control if it\'s not supported', function() {
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

  equal(volumeControl.el().style.display, 'none', 'volumeControl is not hidden');
  equal(muteToggle.el().style.display, 'none', 'muteToggle is not hidden');
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

  equal(volumeControl.el().style.display,
        '',
        'volumeControl is hidden initially');
  equal(muteToggle.el().style.display,
        '',
        'muteToggle is hidden initially');

  player.tech.features.volumeControl = false;
  listeners.forEach(function(listener) {
    listener();
  });

  equal(volumeControl.el().style.display,
        'none',
        'volumeControl does not hide itself');
  equal(muteToggle.el().style.display,
        'none',
        'muteToggle does not hide itself');

  player.tech.features.volumeControl = true;
  listeners.forEach(function(listener) {
    listener();
  });

  equal(volumeControl.el().style.display,
        'block',
        'volumeControl does not show itself');
  equal(muteToggle.el().style.display,
        'block',
        'muteToggle does not show itself');
});
