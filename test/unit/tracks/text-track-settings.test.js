import TextTrackSettings from '../../../src/js/tracks/text-track-settings.js';
import TestHelpers from '../test-helpers.js';
import * as Events from '../../../src/js/utils/events.js';
import safeParseTuple from 'safe-json-parse/tuple';
import window from 'global/window';

const tracks = [{
  kind: 'captions',
  label: 'test'
}];

q.module('Text Track Settings', {
  beforeEach() {
    window.localStorage.clear();
  }
});

test('should update settings', function() {
  let player = TestHelpers.makePlayer({
    tracks,
    persistTextTrackSettings: true
  });
  let newSettings = {
    backgroundOpacity: '1',
    textOpacity: '1',
    windowOpacity: '1',
    edgeStyle: 'raised',
    fontFamily: 'monospaceSerif',
    color: '#FFF',
    backgroundColor: '#FFF',
    windowColor: '#FFF',
    fontPercent: 1.25
  };

  player.textTrackSettings.setValues(newSettings);
  deepEqual(player.textTrackSettings.getValues(), newSettings, 'values are updated');

  equal(player.$('.vjs-fg-color > select').selectedIndex, 1, 'fg-color is set to new value');
  equal(player.$('.vjs-bg-color > select').selectedIndex, 1, 'bg-color is set to new value');
  equal(player.$('.window-color > select').selectedIndex, 1, 'window-color is set to new value');
  equal(player.$('.vjs-text-opacity > select').selectedIndex, 1, 'text-opacity is set to new value');
  equal(player.$('.vjs-bg-opacity > select').selectedIndex, 1, 'bg-opacity is set to new value');
  equal(player.$('.vjs-window-opacity > select').selectedIndex, 1, 'window-opacity is set to new value');
  equal(player.$('.vjs-edge-style select').selectedIndex, 1, 'edge-style is set to new value');
  equal(player.$('.vjs-font-family select').selectedIndex, 1, 'font-family is set to new value');
  equal(player.$('.vjs-font-percent select').selectedIndex, 3, 'font-percent is set to new value');

  Events.trigger(player.$('.vjs-done-button'), 'click');
  deepEqual(safeParseTuple(window.localStorage.getItem('vjs-text-track-settings'))[1], newSettings, 'values are saved');

  player.dispose();
});

test('should restore default settings', function() {
  let player = TestHelpers.makePlayer({
    tracks,
    persistTextTrackSettings: true
  });

  player.$('.vjs-fg-color > select').selectedIndex = 1;
  player.$('.vjs-bg-color > select').selectedIndex = 1;
  player.$('.window-color > select').selectedIndex = 1;
  player.$('.vjs-text-opacity > select').selectedIndex = 1;
  player.$('.vjs-bg-opacity > select').selectedIndex = 1;
  player.$('.vjs-window-opacity > select').selectedIndex = 1;
  player.$('.vjs-edge-style select').selectedIndex = 1;
  player.$('.vjs-font-family select').selectedIndex = 1;
  player.$('.vjs-font-percent select').selectedIndex = 3;

  Events.trigger(player.$('.vjs-done-button'), 'click');
  Events.trigger(player.$('.vjs-default-button'), 'click');
  Events.trigger(player.$('.vjs-done-button'), 'click');

  deepEqual(player.textTrackSettings.getValues(), {}, 'values are defaulted');
  deepEqual(window.localStorage.getItem('vjs-text-track-settings'), null, 'values are saved');

  equal(player.$('.vjs-fg-color > select').selectedIndex, 0, 'fg-color is set to default value');
  equal(player.$('.vjs-bg-color > select').selectedIndex, 0, 'bg-color is set to default value');
  equal(player.$('.window-color > select').selectedIndex, 0, 'window-color is set to default value');
  equal(player.$('.vjs-text-opacity > select').selectedIndex, 0, 'text-opacity is set to default value');
  equal(player.$('.vjs-bg-opacity > select').selectedIndex, 0, 'bg-opacity is set to default value');
  equal(player.$('.vjs-window-opacity > select').selectedIndex, 0, 'window-opacity is set to default value');
  equal(player.$('.vjs-edge-style select').selectedIndex, 0, 'edge-style is set to default value');
  equal(player.$('.vjs-font-family select').selectedIndex, 0, 'font-family is set to default value');
  equal(player.$('.vjs-font-percent select').selectedIndex, 2, 'font-percent is set to default value');

  player.dispose();
});

test('should open on click', function() {
  let player = TestHelpers.makePlayer({
    tracks
  });

  Events.trigger(player.$('.vjs-texttrack-settings'), 'click');
  ok(!player.textTrackSettings.hasClass('vjs-hidden'), 'settings open');

  player.dispose();
});

test('should close on done click', function() {
  let player = TestHelpers.makePlayer({
    tracks
  });

  Events.trigger(player.$('.vjs-texttrack-settings'), 'click');
  Events.trigger(player.$('.vjs-done-button'), 'click');
  ok(player.textTrackSettings.hasClass('vjs-hidden'), 'settings closed');

  player.dispose();
});

test('if persist option is set, restore settings on init', function() {
  let player;
  let oldRestoreSettings = TextTrackSettings.prototype.restoreSettings;
  let restore = 0;

  TextTrackSettings.prototype.restoreSettings = function() {
    restore++;
  };

  player = TestHelpers.makePlayer({
    tracks,
    persistTextTrackSettings: true
  });

  equal(restore, 1, 'restore was called');

  TextTrackSettings.prototype.restoreSettings = oldRestoreSettings;

  player.dispose();
});

test('if persist option is set, save settings when "done"', function() {
  let player = TestHelpers.makePlayer({
    tracks,
    persistTextTrackSettings: true
  });
  let oldSaveSettings = TextTrackSettings.prototype.saveSettings;
  let save = 0;

  TextTrackSettings.prototype.saveSettings = function() {
    save++;
  };

  Events.trigger(player.$('.vjs-done-button'), 'click');

  equal(save, 1, 'save was called');

  TextTrackSettings.prototype.saveSettings = oldSaveSettings;

  player.dispose();
});

test('do not try to restore or save settings if persist option is not set', function() {
  let player;
  let oldRestoreSettings = TextTrackSettings.prototype.restoreSettings;
  let oldSaveSettings = TextTrackSettings.prototype.saveSettings;
  let save = 0;
  let restore = 0;

  TextTrackSettings.prototype.restoreSettings = function() {
    restore++;
  };
  TextTrackSettings.prototype.saveSettings = function() {
    save++;
  };

  player = TestHelpers.makePlayer({
    tracks,
    persistTextTrackSettings: false
  });

  equal(restore, 0, 'restore was not called');

  Events.trigger(player.$('.vjs-done-button'), 'click');

  // saveSettings is called but does nothing
  equal(save, 1, 'save was not called');

  TextTrackSettings.prototype.saveSettings = oldSaveSettings;
  TextTrackSettings.prototype.restoreSettings = oldRestoreSettings;

  player.dispose();
});

test('should restore saved settings', function() {
  let player;
  let newSettings = {
    backgroundOpacity: '1',
    textOpacity: '1',
    windowOpacity: '1',
    edgeStyle: 'raised',
    fontFamily: 'monospaceSerif',
    color: '#FFF',
    backgroundColor: '#FFF',
    windowColor: '#FFF',
    fontPercent: 1.25
  };

  window.localStorage.setItem('vjs-text-track-settings', JSON.stringify(newSettings));

  player = TestHelpers.makePlayer({
    tracks,
    persistTextTrackSettings: true
  });

  deepEqual(player.textTrackSettings.getValues(), newSettings);

  player.dispose();
});

test('should not restore saved settings', function() {
  let player;
  let newSettings = {
    backgroundOpacity: '1',
    textOpacity: '1',
    windowOpacity: '1',
    edgeStyle: 'raised',
    fontFamily: 'monospaceSerif',
    color: '#FFF',
    backgroundColor: '#FFF',
    windowColor: '#FFF',
    fontPercent: 1.25
  };

  window.localStorage.setItem('vjs-text-track-settings', JSON.stringify(newSettings));

  player = TestHelpers.makePlayer({
    tracks,
    persistTextTrackSettings: false
  });

  deepEqual(player.textTrackSettings.getValues(), {});

  player.dispose();
});
