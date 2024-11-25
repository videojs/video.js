/* eslint-env qunit */
import TextTrackSettings from '../../../src/js/tracks/text-track-settings.js';
import TestHelpers from '../test-helpers.js';
import * as Events from '../../../src/js/utils/events.js';
import sinon from 'sinon';
import window from 'global/window';
import Component from '../../../src/js/component.js';
import videojs from '../../../src/js/video.js';

const tracks = [{
  kind: 'captions',
  label: 'test'
}];

const defaultSettings = {
  backgroundColor: '#000',
  backgroundOpacity: '1',
  color: '#FFF',
  fontFamily: 'proportionalSansSerif',
  textOpacity: '1',
  windowColor: '#000',
  windowOpacity: '0'
};

QUnit.module('Text Track Settings', {
  beforeEach() {
    window.localStorage.clear();
    this.oldComponentFocus = Component.prototype.focus;
    this.oldComponentBlur = Component.prototype.blur;
    Component.prototype.focus = function() {};
    Component.prototype.blur = function() {};
  },
  afterEach() {
    Component.prototype.focus = this.oldComponentFocus;
    Component.prototype.blur = this.oldComponentBlur;
  }
});

QUnit.test('should update settings', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks,
    persistTextTrackSettings: true
  });

  const newSettings = {
    backgroundOpacity: '0.5',
    textOpacity: '0.5',
    windowOpacity: '0.5',
    edgeStyle: 'raised',
    fontFamily: 'monospaceSerif',
    color: '#F00',
    backgroundColor: '#FFF',
    windowColor: '#FFF',
    fontPercent: 1.25
  };

  player.textTrackSettings.setValues(newSettings);

  assert.deepEqual(
    player.textTrackSettings.getValues(),
    newSettings,
    'values are updated'
  );

  assert.equal(
    player.$('.vjs-text-color > select').selectedIndex,
    2,
    'text-color is set to new value'
  );

  assert.equal(
    player.$('.vjs-bg-color > select').selectedIndex,
    1,
    'bg-color is set to new value'
  );

  assert.equal(
    player.$('.vjs-window-color > select').selectedIndex,
    1,
    'window-color is set to new value'
  );

  assert.equal(
    player.$('.vjs-text-opacity > select').selectedIndex,
    1,
    'text-opacity is set to new value'
  );

  assert.equal(
    player.$('.vjs-bg-opacity > select').selectedIndex,
    1,
    'bg-opacity is set to new value'
  );

  assert.equal(
    player.$('.vjs-window-opacity > select').selectedIndex,
    1,
    'window-opacity is set to new value'
  );

  assert.equal(
    player.$('.vjs-edge-style select').selectedIndex,
    1,
    'edge-style is set to new value'
  );

  assert.equal(
    player.$('.vjs-font-family select').selectedIndex,
    3,
    'font-family is set to new value'
  );

  assert.equal(
    player.$('.vjs-font-percent select').selectedIndex,
    3,
    'font-percent is set to new value'
  );

  Events.trigger(player.$('.vjs-done-button'), 'click');

  assert.deepEqual(
    JSON.parse(window.localStorage.getItem('vjs-text-track-settings')),
    newSettings,
    'values are saved'
  );

  player.dispose();
});

QUnit.test('should restore default settings', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks,
    persistTextTrackSettings: true
  });

  player.$('.vjs-text-color > select').selectedIndex = 1;
  player.$('.vjs-bg-color > select').selectedIndex = 1;
  player.$('.vjs-window-color > select').selectedIndex = 1;
  player.$('.vjs-text-opacity > select').selectedIndex = 1;
  player.$('.vjs-bg-opacity > select').selectedIndex = 1;
  player.$('.vjs-window-opacity > select').selectedIndex = 1;
  player.$('.vjs-edge-style select').selectedIndex = 1;
  player.$('.vjs-font-family select').selectedIndex = 1;
  player.$('.vjs-font-percent select').selectedIndex = 3;

  Events.trigger(player.$('.vjs-done-button'), 'click');
  Events.trigger(player.$('.vjs-default-button'), 'click');
  Events.trigger(player.$('.vjs-done-button'), 'click');

  assert.deepEqual(
    player.textTrackSettings.getValues(),
    defaultSettings,
    'values are defaulted'
  );
  // TODO:
  // MikeA: need to figure out how to modify saveSettings
  // to factor in defaults are no longer null
  // assert.deepEqual(window.localStorage.getItem('vjs-text-track-settings'),
  //                 defaultSettings,
  //                 'values are saved');

  assert.equal(
    player.$('.vjs-text-color > select').selectedIndex,
    0,
    'text-color is set to default value'
  );

  assert.equal(
    player.$('.vjs-bg-color > select').selectedIndex,
    0,
    'bg-color is set to default value'
  );

  assert.equal(
    player.$('.vjs-window-color > select').selectedIndex,
    0,
    'window-color is set to default value'
  );

  assert.equal(
    player.$('.vjs-text-opacity > select').selectedIndex,
    0,
    'text-opacity is set to default value'
  );

  assert.equal(
    player.$('.vjs-bg-opacity > select').selectedIndex,
    0,
    'bg-opacity is set to default value'
  );

  assert.equal(
    player.$('.vjs-window-opacity > select').selectedIndex,
    0,
    'window-opacity is set to default value'
  );

  assert.equal(
    player.$('.vjs-edge-style select').selectedIndex,
    0,
    'edge-style is set to default value'
  );

  assert.equal(
    player.$('.vjs-font-family select').selectedIndex,
    0,
    'font-family is set to default value'
  );

  assert.equal(
    player.$('.vjs-font-percent select').selectedIndex,
    2,
    'font-percent is set to default value'
  );

  player.dispose();
});

QUnit.test('should open on click', function(assert) {
  const clock = sinon.useFakeTimers();
  const player = TestHelpers.makePlayer({
    tracks
  });

  clock.tick(1);

  Events.trigger(player.$('.vjs-texttrack-settings'), 'click');
  assert.ok(!player.textTrackSettings.hasClass('vjs-hidden'), 'settings open');

  player.dispose();
  clock.restore();
});

QUnit.test('should close on done click', function(assert) {
  const clock = sinon.useFakeTimers();
  const player = TestHelpers.makePlayer({
    tracks
  });

  clock.tick(1);

  Events.trigger(player.$('.vjs-texttrack-settings'), 'click');
  Events.trigger(player.$('.vjs-done-button'), 'click');
  assert.ok(player.textTrackSettings.hasClass('vjs-hidden'), 'settings closed');

  player.dispose();
  clock.restore();
});

QUnit.test('if persist option is set, restore settings on init', function(assert) {
  const oldRestoreSettings = TextTrackSettings.prototype.restoreSettings;
  let restore = 0;

  TextTrackSettings.prototype.restoreSettings = function() {
    restore++;
  };

  const player = TestHelpers.makePlayer({
    tracks,
    persistTextTrackSettings: true
  });

  assert.equal(restore, 1, 'restore was called');

  TextTrackSettings.prototype.restoreSettings = oldRestoreSettings;

  player.dispose();
});

QUnit.test('if persist option is set, save settings when "done"', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks,
    persistTextTrackSettings: true
  });

  const oldSaveSettings = TextTrackSettings.prototype.saveSettings;
  let save = 0;

  TextTrackSettings.prototype.saveSettings = function() {
    save++;
  };

  Events.trigger(player.$('.vjs-done-button'), 'click');

  assert.equal(save, 1, 'save was called');

  TextTrackSettings.prototype.saveSettings = oldSaveSettings;

  player.dispose();
});

QUnit.test('do not try to restore or save settings if persist option is not set', function(assert) {
  const oldRestoreSettings = TextTrackSettings.prototype.restoreSettings;
  const oldSaveSettings = TextTrackSettings.prototype.saveSettings;
  let save = 0;
  let restore = 0;

  TextTrackSettings.prototype.restoreSettings = function() {
    restore++;
  };
  TextTrackSettings.prototype.saveSettings = function() {
    save++;
  };

  const player = TestHelpers.makePlayer({
    tracks,
    persistTextTrackSettings: false
  });

  assert.equal(restore, 0, 'restore was not called');

  Events.trigger(player.$('.vjs-done-button'), 'click');

  // saveSettings is called but does nothing
  assert.equal(save, 1, 'save was not called');

  TextTrackSettings.prototype.saveSettings = oldSaveSettings;
  TextTrackSettings.prototype.restoreSettings = oldRestoreSettings;

  player.dispose();
});

QUnit.test('should restore saved settings', function(assert) {
  const newSettings = {
    backgroundOpacity: '0.5',
    textOpacity: '0.5',
    windowOpacity: '0.5',
    edgeStyle: 'raised',
    fontFamily: 'monospaceSerif',
    color: '#F00',
    backgroundColor: '#FFF',
    windowColor: '#FFF',
    fontPercent: 1.25
  };

  window.localStorage.setItem('vjs-text-track-settings', JSON.stringify(newSettings));

  const player = TestHelpers.makePlayer({
    tracks,
    persistTextTrackSettings: true
  });

  assert.deepEqual(player.textTrackSettings.getValues(), newSettings);

  player.dispose();
});

QUnit.test('should not restore saved settings', function(assert) {
  const newSettings = {
    backgroundOpacity: '0.5',
    textOpacity: '0.5',
    windowOpacity: '0.5',
    edgeStyle: 'raised',
    fontFamily: 'monospaceSerif',
    color: '#F00',
    backgroundColor: '#FFF',
    windowColor: '#FFF',
    fontPercent: 1.25
  };

  window.localStorage.setItem('vjs-text-track-settings', JSON.stringify(newSettings));

  const player = TestHelpers.makePlayer({
    tracks,
    persistTextTrackSettings: false
  });

  assert.deepEqual(player.textTrackSettings.getValues(), defaultSettings);

  player.dispose();
});

QUnit.test('should update on languagechange', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks
  });

  videojs.addLanguage('test', {
    'Font Size': 'FONTSIZE',
    'Color': 'COLOR',
    'White': 'WHITE'
  });
  player.language('test');

  assert.equal(player.$('.vjs-font-percent legend').textContent, 'FONTSIZE', 'settings dialog updates on languagechange');
  assert.equal(player.$('.vjs-text-color label').textContent, 'COLOR', 'settings dialog label updates on languagechange');
  assert.equal(player.$('.vjs-text-color select option').textContent, 'WHITE', 'settings dialog select updates on languagechange');

  player.dispose();
});

QUnit.test('should associate <label>s with <select>s', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks
  });

  const firstLabelFor = player.textTrackSettings.el_.querySelector('label').getAttribute('for');

  assert.ok(
    videojs.dom.isEl(player.textTrackSettings.el_.querySelector(`#${firstLabelFor}`)),
    'label has a `for` attribute matching an `id`'
  );

});

QUnit.test('should not duplicate ids', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks
  });

  const elements = [...player.el().querySelectorAll('[id]')];
  const ids = elements.map(el => el.id);
  const duplicates = elements.filter(el => ids.filter(id => id === el.id).length > 1);

  assert.strictEqual(duplicates.length, 0, 'there should be no duplicate ids');
});
