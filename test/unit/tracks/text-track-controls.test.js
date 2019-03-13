/* eslint-env qunit */
import TextTrackMenuItem from '../../../src/js/control-bar/text-track-controls/text-track-menu-item.js';
import TestHelpers from '../test-helpers.js';
import sinon from 'sinon';

QUnit.module('Text Track Controls', {
  beforeEach(assert) {
    this.clock = sinon.useFakeTimers();
  },
  afterEach(assert) {
    this.clock.restore();
  }
});

const track = {
  kind: 'captions',
  label: 'test'
};

QUnit.test('should be displayed when text tracks list is not empty', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks: [track]
  });

  this.clock.tick(1000);

  assert.ok(
    !player.controlBar.subsCapsButton.hasClass('vjs-hidden'),
    'control is displayed'
  );
  assert.equal(player.textTracks().length, 1, 'textTracks contains one item');

  player.dispose();
});

QUnit.test('should be displayed when a text track is added to an empty track list', function(assert) {
  const player = TestHelpers.makePlayer();

  player.addRemoteTextTrack(track, true);

  assert.ok(
    !player.controlBar.subsCapsButton.hasClass('vjs-hidden'),
    'control is displayed'
  );
  assert.equal(player.textTracks().length, 1, 'textTracks contains one item');

  player.dispose();
});

QUnit.test('should not be displayed when text tracks list is empty', function(assert) {
  const player = TestHelpers.makePlayer();

  assert.ok(
    player.controlBar.subsCapsButton.hasClass('vjs-hidden'),
    'control is not displayed'
  );
  assert.equal(player.textTracks().length, 0, 'textTracks is empty');

  player.dispose();
});

QUnit.test('should not be displayed when last text track is removed', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks: [track]
  });

  player.removeRemoteTextTrack(player.textTracks()[0]);

  assert.ok(
    player.controlBar.subsCapsButton.hasClass('vjs-hidden'),
    'control is not displayed'
  );
  assert.equal(player.textTracks().length, 0, 'textTracks is empty');

  player.dispose();
});

QUnit.test('menu should contain "Settings", "Off" and one track', function(assert) {
  const player = TestHelpers.makePlayer({
    language: 'en',
    tracks: [track]
  });

  this.clock.tick(1000);

  const menuItems = player.controlBar.subsCapsButton.items;

  assert.equal(menuItems.length, 3, 'menu contains three items');
  assert.equal(
    menuItems[0].track.label,
    'captions settings',
    'menu contains "captions settings"'
  );
  assert.equal(menuItems[1].track.label, 'captions off', 'menu contains "captions off"');
  assert.equal(menuItems[2].track.label, 'test', 'menu contains "test" track');

  player.dispose();
});

QUnit.test('menu should contain "Settings", "Off", one captions and one subtitles track', function(assert) {
  const player = TestHelpers.makePlayer({
    language: 'en',
    tracks: [track, {
      kind: 'subtitles',
      label: 'test subs'
    }]
  });

  this.clock.tick(1000);

  const menuItems = player.controlBar.subsCapsButton.items;

  assert.equal(menuItems.length, 4, 'menu contains three items');
  assert.equal(
    menuItems[0].track.label,
    'captions settings',
    'menu contains "captions settings"'
  );
  assert.equal(menuItems[1].track.label, 'captions off', 'menu contains "captions off"');
  assert.equal(menuItems[2].track.label, 'test', 'menu contains "test" track');

  player.dispose();
});

QUnit.test('menu should update with addRemoteTextTrack', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks: [track]
  });

  this.clock.tick(1000);

  player.addRemoteTextTrack(track, true);

  assert.equal(
    player.controlBar.subsCapsButton.items.length,
    4,
    'menu does contain added track'
  );
  assert.equal(player.textTracks().length, 2, 'textTracks contains two items');

  player.dispose();
});

QUnit.test('menu should update with removeRemoteTextTrack', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks: [track, track]
  });

  this.clock.tick(1000);

  player.removeRemoteTextTrack(player.textTracks()[0]);

  assert.equal(
    player.controlBar.subsCapsButton.items.length,
    3,
    'menu does not contain removed track'
  );
  assert.equal(player.textTracks().length, 1, 'textTracks contains one item');

  player.dispose();
});

const descriptionstrack = {
  kind: 'descriptions',
  label: 'desc'
};

QUnit.test('descriptions should be displayed when text tracks list is not empty', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks: [descriptionstrack]
  });

  this.clock.tick(1000);

  assert.ok(
    !player.controlBar.descriptionsButton.hasClass('vjs-hidden'),
    'descriptions control is displayed'
  );
  assert.equal(player.textTracks().length, 1, 'textTracks contains one item');

  player.dispose();
});

QUnit.test('descriptions should be displayed when a text track is added to an empty track list', function(assert) {
  const player = TestHelpers.makePlayer();

  player.addRemoteTextTrack(descriptionstrack, true);

  assert.ok(
    !player.controlBar.descriptionsButton.hasClass('vjs-hidden'),
    'control is displayed'
  );
  assert.equal(player.textTracks().length, 1, 'textTracks contains one item');

  player.dispose();
});

QUnit.test('descriptions should not be displayed when text tracks list is empty', function(assert) {
  const player = TestHelpers.makePlayer();

  assert.ok(
    player.controlBar.descriptionsButton.hasClass('vjs-hidden'),
    'control is not displayed'
  );
  assert.equal(player.textTracks().length, 0, 'textTracks is empty');

  player.dispose();
});

QUnit.test('descriptions should not be displayed when last text track is removed', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks: [descriptionstrack]
  });

  player.removeRemoteTextTrack(player.textTracks()[0]);

  assert.ok(
    player.controlBar.descriptionsButton.hasClass('vjs-hidden'),
    'control is not displayed'
  );
  assert.equal(player.textTracks().length, 0, 'textTracks is empty');

  player.dispose();
});

QUnit.test('descriptions menu should contain "Off" and one track', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks: [descriptionstrack]
  });

  this.clock.tick(1000);

  const menuItems = player.controlBar.descriptionsButton.items;

  assert.equal(menuItems.length, 2, 'descriptions menu contains two items');
  assert.equal(
    menuItems[0].track.label,
    'descriptions off',
    'menu contains "descriptions off"'
  );
  assert.equal(menuItems[1].track.label, 'desc', 'menu contains "desc" track');

  player.dispose();
});

QUnit.test('enabling a captions track should disable the descriptions menu button', function(assert) {
  assert.expect(14);

  const player = TestHelpers.makePlayer({
    tracks: [track, descriptionstrack]
  });

  this.clock.tick(1000);

  assert.ok(
    !player.controlBar.subsCapsButton.hasClass('vjs-hidden'),
    'captions control is displayed'
  );
  assert.ok(
    !player.controlBar.descriptionsButton.hasClass('vjs-hidden'),
    'descriptions control is displayed'
  );
  assert.equal(player.textTracks().length, 2, 'textTracks contains two items');

  assert.ok(
    !player.controlBar.subsCapsButton.hasClass('vjs-disabled'),
    'captions control is NOT disabled'
  );
  assert.ok(
    !player.controlBar.descriptionsButton.hasClass('vjs-disabled'),
    'descriptions control is NOT disabled'
  );

  for (let i = 0; i < player.textTracks().length; i++) {
    if (player.textTracks()[i].kind === 'descriptions') {
      player.textTracks()[i].mode = 'showing';
      assert.ok(
        player.textTracks()[i].kind === 'descriptions' &&
               player.textTracks()[i].mode === 'showing',
        'descriptions mode set to showing'
      );
    }
  }

  this.clock.tick(1000);

  assert.ok(
    !player.controlBar.subsCapsButton.hasClass('vjs-disabled'),
    'captions control is NOT disabled'
  );
  assert.ok(
    !player.controlBar.descriptionsButton.hasClass('vjs-disabled'),
    'descriptions control is NOT disabled'
  );

  for (let i = 0; i < player.textTracks().length; i++) {
    if (player.textTracks()[i].kind === 'captions') {
      player.textTracks()[i].mode = 'showing';
      assert.ok(
        player.textTracks()[i].kind === 'captions' &&
               player.textTracks()[i].mode === 'showing',
        'captions mode set to showing'
      );
    }
  }

  this.clock.tick(1000);

  assert.ok(
    !player.controlBar.subsCapsButton.hasClass('vjs-disabled'),
    'captions control is NOT disabled'
  );
  assert.ok(
    player.controlBar.descriptionsButton.hasClass('vjs-disabled'),
    'descriptions control IS disabled'
  );

  for (let i = 0; i < player.textTracks().length; i++) {
    if (player.textTracks()[i].kind === 'captions') {
      player.textTracks()[i].mode = 'disabled';
      assert.ok(
        player.textTracks()[i].kind === 'captions' &&
               player.textTracks()[i].mode === 'disabled',
        'captions mode set to disabled'
      );
    }
  }

  this.clock.tick(1000);

  assert.ok(
    !player.controlBar.subsCapsButton.hasClass('vjs-disabled'),
    'captions control is NOT disabled'
  );
  assert.ok(
    !player.controlBar.descriptionsButton.hasClass('vjs-disabled'),
    'descriptions control is NOT disabled'
  );

  player.dispose();
});

// This test tests a specific with iOS7 where
// the TextTrackList doesn't report track mode changes.
QUnit.test('menu items should polyfill mode change events', function(assert) {
  const player = TestHelpers.makePlayer({});
  let changes;

  // emulate a TextTrackList that doesn't report track mode changes,
  // like iOS7
  player.textTracks().onchange = undefined;
  const trackMenuItem = new TextTrackMenuItem(player, {
    track
  });

  player.textTracks().on('change', function() {
    changes++;
  });
  changes = 0;
  trackMenuItem.trigger('tap');
  assert.equal(changes, 1, 'taps trigger change events');

  trackMenuItem.trigger('click');
  assert.equal(changes, 2, 'clicks trigger change events');

  player.dispose();
  trackMenuItem.dispose();
  player.textTracks().off('change');
});

const chaptersTrack = {
  kind: 'chapters',
  label: 'Test Chapters'
};

QUnit.test('chapters should not be displayed when text tracks list is empty', function(assert) {
  const player = TestHelpers.makePlayer();

  assert.ok(player.controlBar.chaptersButton.hasClass('vjs-hidden'), 'control is not displayed');
  assert.equal(player.textTracks().length, 0, 'textTracks is empty');

  player.dispose();
});

QUnit.test('chapters should not be displayed when there is chapters track but no cues', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks: [chaptersTrack]
  });

  this.clock.tick(1000);

  assert.ok(player.controlBar.chaptersButton.hasClass('vjs-hidden'), 'chapters menu is not displayed');
  assert.equal(player.textTracks().length, 1, 'textTracks contains one item');

  player.dispose();
});

QUnit.test('chapters should be displayed when cues added to initial track and button updated', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks: [chaptersTrack]
  });

  this.clock.tick(1000);

  const chapters = player.textTracks()[0];

  chapters.addCue({
    startTime: 0,
    endTime: 2,
    text: 'Chapter 1'
  });
  chapters.addCue({
    startTime: 2,
    endTime: 4,
    text: 'Chapter 2'
  });
  assert.equal(chapters.cues.length, 2);

  player.controlBar.chaptersButton.update();

  assert.ok(!player.controlBar.chaptersButton.hasClass('vjs-hidden'), 'chapters menu is displayed');

  const menuItems = player.controlBar.chaptersButton.items;

  assert.equal(menuItems.length, 2, 'menu contains two item');

  player.dispose();
});

QUnit.test('chapters should be displayed when a track and its cures added and button updated', function(assert) {
  const player = TestHelpers.makePlayer();

  this.clock.tick(1000);

  const chapters = player.addTextTrack('chapters', 'Test Chapters', 'en');

  chapters.addCue({
    startTime: 0,
    endTime: 2,
    text: 'Chapter 1'
  });
  chapters.addCue({
    startTime: 2,
    endTime: 4,
    text: 'Chapter 2'
  });
  assert.equal(chapters.cues.length, 2);

  player.controlBar.chaptersButton.update();

  assert.ok(!player.controlBar.chaptersButton.hasClass('vjs-hidden'), 'chapters menu is displayed');

  const menuItems = player.controlBar.chaptersButton.items;

  assert.equal(menuItems.length, 2, 'menu contains two item');

  player.dispose();
});

QUnit.test('chapters menu should use track label as menu title', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks: [chaptersTrack]
  });

  this.clock.tick(1000);

  const chapters = player.textTracks()[0];

  chapters.addCue({
    startTime: 0,
    endTime: 2,
    text: 'Chapter 1'
  });
  chapters.addCue({
    startTime: 2,
    endTime: 4,
    text: 'Chapter 2'
  });
  assert.equal(chapters.cues.length, 2);

  player.controlBar.chaptersButton.update();

  const menu = player.controlBar.chaptersButton.menu;
  const titleEl = menu.contentEl().firstChild;
  const menuTitle = titleEl.textContent || titleEl.innerText;

  assert.equal(menuTitle, 'Test Chapters', 'menu gets track label as title');

  player.dispose();
});

QUnit.test('chapters should be displayed when remote track added and load event fired', function(assert) {
  const player = TestHelpers.makePlayer();

  this.clock.tick(1000);

  const chaptersEl = player.addRemoteTextTrack(chaptersTrack, true);

  chaptersEl.track.addCue({
    startTime: 0,
    endTime: 2,
    text: 'Chapter 1'
  });
  chaptersEl.track.addCue({
    startTime: 2,
    endTime: 4,
    text: 'Chapter 2'
  });

  assert.equal(chaptersEl.track.cues.length, 2);

  // Anywhere where we support using native text tracks, we can trigger a custom DOM event.
  // On IE8 and other places where we have emulated tracks, either we cannot trigger custom
  // DOM events (like IE8 with the custom DOM element) or we aren't using a DOM element at all.
  // In those cases just trigger `load` directly on the chaptersEl object.
  if (player.tech_.featuresNativeTextTracks) {
    TestHelpers.triggerDomEvent(chaptersEl, 'load');
  } else {
    chaptersEl.trigger('load');
  }

  assert.ok(!player.controlBar.chaptersButton.hasClass('vjs-hidden'), 'chapters menu is displayed');

  const menuItems = player.controlBar.chaptersButton.items;

  assert.equal(menuItems.length, 2, 'menu contains two item');

  player.dispose();
});
