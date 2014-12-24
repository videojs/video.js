module('Text Track Settings');

var tracks = [{
  kind: 'captions',
  label: 'test'
}];

test('should open on click', function() {
  var player = PlayerTest.makePlayer(tracks);
  vjs.trigger(player.el().querySelector('.vjs-texttrack-settings'), 'click');
  ok(!player.textTrackSettings.hasClass('vjs-hidden'), 'settings open');
});

test('should close on done click', function() {
  var player = PlayerTest.makePlayer(tracks);
  vjs.trigger(player.el().querySelector('.vjs-done-button'), 'click');
  ok(player.textTrackSettings.hasClass('vjs-hidden'), 'settings closed');
});

test('if persist option is set, restore settings on init', function() {
  var player,
      oldRestoreSettings = vjs.TextTrackSettings.prototype.restoreSettings,
      restore = 0;

  vjs.TextTrackSettings.prototype.restoreSettings = function() {
    restore++;
  };

  player = PlayerTest.makePlayer({
    tracks: tracks,
    persistTextTrackSettings: true
  });

  equal(restore, 1, 'restore was called');

  vjs.TextTrackSettings.prototype.restoreSettings = oldRestoreSettings;
});

test('if persist option is set, save settings when "done"', function() {
  var player = PlayerTest.makePlayer({
        tracks: tracks,
        persistTextTrackSettings: true
      }),
      oldSaveSettings = vjs.TextTrackSettings.prototype.saveSettings,
      save = 0;

  vjs.TextTrackSettings.prototype.saveSettings = function() {
    save++;
  };

  vjs.trigger(player.el().querySelector('.vjs-done-button'), 'click');

  equal(save, 1, 'save was called');

  vjs.TextTrackSettings.prototype.saveSettings = oldSaveSettings;
});

test('do not try to restore or save settings if persist option is not set', function() {
  var player,
      oldRestoreSettings = vjs.TextTrackSettings.prototype.restoreSettings,
      oldSaveSettings = vjs.TextTrackSettings.prototype.saveSettings,
      save = 0,
      restore = 0;

  vjs.TextTrackSettings.prototype.restoreSettings = function() {
    restore++;
  };
  vjs.TextTrackSettings.prototype.saveSettings = function() {
    save++;
  };

  player = PlayerTest.makePlayer({
    tracks: tracks,
    persistTextTrackSettings: true
  });

  equal(restore, 1, 'restore was not called');

  vjs.trigger(player.el().querySelector('.vjs-done-button'), 'click');

  equal(save, 1, 'save was not called');

  vjs.TextTrackSettings.prototype.saveSettings = oldSaveSettings;
  vjs.TextTrackSettings.prototype.restoreSettings = oldRestoreSettings;
});
