/* eslint-env qunit */
import TextTrackMenuItem from '../../../src/js/control-bar/text-track-controls/text-track-menu-item.js';
import TestHelpers from '../test-helpers.js';
import * as browser from '../../../src/js/utils/browser.js';
import sinon from 'sinon';

QUnit.module('Text Track Controls', {
  setup() {
    this.clock = sinon.useFakeTimers();
  },
  teardown() {
    this.clock.restore();
  }
});

const track = {
  kind: 'captions',
  label: 'test'
};

QUnit.test('should be displayed when text tracks list is not empty', function() {
  const player = TestHelpers.makePlayer({
    tracks: [track]
  });

  this.clock.tick(1000);

  QUnit.ok(!player.controlBar.captionsButton.hasClass('vjs-hidden'),
           'control is displayed');
  QUnit.equal(player.textTracks().length, 1, 'textTracks contains one item');

  player.dispose();
});

QUnit.test('should be displayed when a text track is added to an empty track list', function() {
  const player = TestHelpers.makePlayer();

  player.addRemoteTextTrack(track);

  QUnit.ok(!player.controlBar.captionsButton.hasClass('vjs-hidden'),
           'control is displayed');
  QUnit.equal(player.textTracks().length, 1, 'textTracks contains one item');

  player.dispose();
});

QUnit.test('should not be displayed when text tracks list is empty', function() {
  const player = TestHelpers.makePlayer();

  QUnit.ok(player.controlBar.captionsButton.hasClass('vjs-hidden'),
           'control is not displayed');
  QUnit.equal(player.textTracks().length, 0, 'textTracks is empty');

  player.dispose();
});

QUnit.test('should not be displayed when last text track is removed', function() {
  const player = TestHelpers.makePlayer({
    tracks: [track]
  });

  player.removeRemoteTextTrack(player.textTracks()[0]);

  QUnit.ok(player.controlBar.captionsButton.hasClass('vjs-hidden'),
           'control is not displayed');
  QUnit.equal(player.textTracks().length, 0, 'textTracks is empty');

  player.dispose();
});

QUnit.test('menu should contain "Settings", "Off" and one track', function() {
  const player = TestHelpers.makePlayer({
    tracks: [track]
  });

  this.clock.tick(1000);

  const menuItems = player.controlBar.captionsButton.items;

  QUnit.equal(menuItems.length, 3, 'menu contains three items');
  QUnit.equal(menuItems[0].track.label,
              'captions settings',
              'menu contains "captions settings"');
  QUnit.equal(menuItems[1].track.label, 'captions off', 'menu contains "captions off"');
  QUnit.equal(menuItems[2].track.label, 'test', 'menu contains "test" track');

  player.dispose();
});

QUnit.test('menu should update with addRemoteTextTrack', function() {
  const player = TestHelpers.makePlayer({
    tracks: [track]
  });

  this.clock.tick(1000);

  player.addRemoteTextTrack(track);

  QUnit.equal(player.controlBar.captionsButton.items.length,
              4,
              'menu does contain added track');
  QUnit.equal(player.textTracks().length, 2, 'textTracks contains two items');

  player.dispose();
});

QUnit.test('menu should update with removeRemoteTextTrack', function() {
  const player = TestHelpers.makePlayer({
    tracks: [track, track]
  });

  this.clock.tick(1000);

  player.removeRemoteTextTrack(player.textTracks()[0]);

  QUnit.equal(player.controlBar.captionsButton.items.length,
              3,
              'menu does not contain removed track');
  QUnit.equal(player.textTracks().length, 1, 'textTracks contains one item');

  player.dispose();
});

const descriptionstrack = {
  kind: 'descriptions',
  label: 'desc'
};

QUnit.test('descriptions should be displayed when text tracks list is not empty', function() {
  const player = TestHelpers.makePlayer({
    tracks: [descriptionstrack]
  });

  this.clock.tick(1000);

  QUnit.ok(!player.controlBar.descriptionsButton.hasClass('vjs-hidden'),
           'descriptions control is displayed');
  QUnit.equal(player.textTracks().length, 1, 'textTracks contains one item');

  player.dispose();
});

QUnit.test('descriptions should be displayed when a text track is added to an empty track list', function() {
  const player = TestHelpers.makePlayer();

  player.addRemoteTextTrack(descriptionstrack);

  QUnit.ok(!player.controlBar.descriptionsButton.hasClass('vjs-hidden'),
           'control is displayed');
  QUnit.equal(player.textTracks().length, 1, 'textTracks contains one item');

  player.dispose();
});

QUnit.test('descriptions should not be displayed when text tracks list is empty', function() {
  const player = TestHelpers.makePlayer();

  QUnit.ok(player.controlBar.descriptionsButton.hasClass('vjs-hidden'),
           'control is not displayed');
  QUnit.equal(player.textTracks().length, 0, 'textTracks is empty');

  player.dispose();
});

QUnit.test('descriptions should not be displayed when last text track is removed', function() {
  const player = TestHelpers.makePlayer({
    tracks: [descriptionstrack]
  });

  player.removeRemoteTextTrack(player.textTracks()[0]);

  QUnit.ok(player.controlBar.descriptionsButton.hasClass('vjs-hidden'),
           'control is not displayed');
  QUnit.equal(player.textTracks().length, 0, 'textTracks is empty');

  player.dispose();
});

QUnit.test('descriptions menu should contain "Off" and one track', function() {
  const player = TestHelpers.makePlayer({
    tracks: [descriptionstrack]
  });

  this.clock.tick(1000);

  const menuItems = player.controlBar.descriptionsButton.items;

  QUnit.equal(menuItems.length, 2, 'descriptions menu contains two items');
  QUnit.equal(menuItems[0].track.label,
              'descriptions off',
              'menu contains "descriptions off"');
  QUnit.equal(menuItems[1].track.label, 'desc', 'menu contains "desc" track');

  player.dispose();
});

QUnit.test('enabling a captions track should disable the descriptions menu button', function() {
  QUnit.expect(14);

  const player = TestHelpers.makePlayer({
    tracks: [track, descriptionstrack]
  });

  this.clock.tick(1000);

  QUnit.ok(!player.controlBar.captionsButton.hasClass('vjs-hidden'),
           'captions control is displayed');
  QUnit.ok(!player.controlBar.descriptionsButton.hasClass('vjs-hidden'),
           'descriptions control is displayed');
  QUnit.equal(player.textTracks().length, 2, 'textTracks contains two items');

  QUnit.ok(!player.controlBar.captionsButton.hasClass('vjs-disabled'),
           'captions control is NOT disabled');
  QUnit.ok(!player.controlBar.descriptionsButton.hasClass('vjs-disabled'),
           'descriptions control is NOT disabled');

  for (let i = 0; i < player.textTracks().length; i++) {
    if (player.textTracks()[i].kind === 'descriptions') {
      player.textTracks()[i].mode = 'showing';
      QUnit.ok(player.textTracks()[i].kind === 'descriptions' &&
               player.textTracks()[i].mode === 'showing',
               'descriptions mode set to showing');
    }
  }

  this.clock.tick(1000);

  QUnit.ok(!player.controlBar.captionsButton.hasClass('vjs-disabled'),
           'captions control is NOT disabled');
  QUnit.ok(!player.controlBar.descriptionsButton.hasClass('vjs-disabled'),
           'descriptions control is NOT disabled');

  for (let i = 0; i < player.textTracks().length; i++) {
    if (player.textTracks()[i].kind === 'captions') {
      player.textTracks()[i].mode = 'showing';
      QUnit.ok(player.textTracks()[i].kind === 'captions' &&
               player.textTracks()[i].mode === 'showing',
               'captions mode set to showing');
    }
  }

  this.clock.tick(1000);

  QUnit.ok(!player.controlBar.captionsButton.hasClass('vjs-disabled'),
           'captions control is NOT disabled');
  QUnit.ok(player.controlBar.descriptionsButton.hasClass('vjs-disabled'),
           'descriptions control IS disabled');

  for (let i = 0; i < player.textTracks().length; i++) {
    if (player.textTracks()[i].kind === 'captions') {
      player.textTracks()[i].mode = 'disabled';
      QUnit.ok(player.textTracks()[i].kind === 'captions' &&
               player.textTracks()[i].mode === 'disabled',
               'captions mode set to disabled');
    }
  }

  this.clock.tick(1000);

  QUnit.ok(!player.controlBar.captionsButton.hasClass('vjs-disabled'),
           'captions control is NOT disabled');
  QUnit.ok(!player.controlBar.descriptionsButton.hasClass('vjs-disabled'),
           'descriptions control is NOT disabled');

  player.dispose();
});

if (!browser.IS_IE8) {
  // This test doesn't work on IE8.
  // However, this test tests a specific with iOS7 where
  // the TextTrackList doesn't report track mode changes.
  // TODO: figure out why this test doens't work on IE8. https://github.com/videojs/video.js/issues/1861
  QUnit.test('menu items should polyfill mode change events', function() {
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
    QUnit.equal(changes, 1, 'taps trigger change events');

    trackMenuItem.trigger('click');
    QUnit.equal(changes, 2, 'clicks trigger change events');

    player.dispose();
  });
}
