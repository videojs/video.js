/* eslint-env qunit */
import Html5 from '../../../src/js/tech/html5.js';
import Component from '../../../src/js/component.js';

import * as browser from '../../../src/js/utils/browser.js';
import TestHelpers from '../test-helpers.js';
import document from 'global/document';
import sinon from 'sinon';

QUnit.module('Text Track Display', {
  beforeEach(assert) {
    this.clock = sinon.useFakeTimers();
  },
  afterEach(assert) {
    this.clock.restore();
  }
});

const getTrackByLanguage = function(player, language) {
  const tracks = player.tech_.remoteTextTracks();

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];

    if (track.language === language) {
      return track;
    }
  }
};

const getMenuItemByLanguage = function(items, language) {
  for (let i = items.length - 1; i > 0; i--) {
    const captionMenuItem = items[i];
    const trackLanguage = captionMenuItem.track.language;

    if (trackLanguage && trackLanguage === language) {
      return captionMenuItem;
    }
  }
};

QUnit.test('if native text tracks are not supported, create a texttrackdisplay', function(assert) {
  const oldTestVid = Html5.TEST_VID;
  const oldIsFirefox = browser.IS_FIREFOX;
  const oldTextTrackDisplay = Component.getComponent('TextTrackDisplay');
  const tag = document.createElement('video');
  const track1 = document.createElement('track');
  const track2 = document.createElement('track');

  track1.kind = 'captions';
  track1.label = 'en';
  track1.language = 'English';
  track1.src = 'en.vtt';
  tag.appendChild(track1);

  track2.kind = 'captions';
  track2.label = 'es';
  track2.language = 'Spanish';
  track2.src = 'es.vtt';
  tag.appendChild(track2);

  Html5.TEST_VID = {
    textTracks: []
  };

  browser.IS_FIREFOX = true;

  const fakeTTDSpy = sinon.spy();

  class FakeTTD extends Component {
    constructor() {
      super();
      fakeTTDSpy();
    }
  }

  Component.registerComponent('TextTrackDisplay', FakeTTD);

  const player = TestHelpers.makePlayer({}, tag);

  assert.strictEqual(fakeTTDSpy.callCount, 1, 'text track display was created');

  Html5.TEST_VID = oldTestVid;
  browser.IS_FIREFOX = oldIsFirefox;
  Component.registerComponent('TextTrackDisplay', oldTextTrackDisplay);

  player.dispose();
});

QUnit.test('no captions tracks, no captions are displayed', function(assert) {
  // The video has no captions
  const player = TestHelpers.makePlayer();
  const tracks = player.tech_.remoteTextTracks();
  const captionsButton = player.controlBar.getChild('SubsCapsButton');

  player.src({type: 'video/mp4', src: 'http://google.com'});
  this.clock.tick(1);

  // the captions track and button are not shown
  assert.ok(tracks.length === 0, 'No captions tracks');
  assert.ok(captionsButton.hasClass('vjs-hidden'), 'The captions button should not be shown');
  player.dispose();
});

QUnit.test('shows the default caption track first', function(assert) {
  const player = TestHelpers.makePlayer();
  const track1 = {
    kind: 'captions',
    label: 'English',
    language: 'en',
    src: 'en.vtt',
    default: true
  };
  const track2 = {
    kind: 'captions',
    label: 'Spanish',
    language: 'es',
    src: 'es.vtt'
  };

  // Add the text tracks
  player.addRemoteTextTrack(track1);
  player.addRemoteTextTrack(track2);

  // Make sure the ready handler runs
  this.clock.tick(1);

  const englishTrack = getTrackByLanguage(player, 'en');
  const spanishTrack = getTrackByLanguage(player, 'es');

  assert.ok(englishTrack.mode === 'showing', 'English track should be showing');
  assert.ok(spanishTrack.mode === 'disabled', 'Spanish track should not be showing');
  player.dispose();
});

QUnit.test('if user-selected language is unavailable, don\'t pick a track to show', function(assert) {
  // The video has no default language but has ‘English’ captions only
  const player = TestHelpers.makePlayer();
  const track1 = {
    kind: 'captions',
    label: 'English',
    language: 'en',
    src: 'en.vtt'
  };
  const captionsButton = player.controlBar.getChild('SubsCapsButton');

  player.src({type: 'video/mp4', src: 'http://google.com'});
  // manualCleanUp = true by default
  player.addRemoteTextTrack(track1);
  // Force 'es' as user-selected track
  player.cache_.selectedLanguage = 'es';

  this.clock.tick(1);
  player.play();

  const englishTrack = getTrackByLanguage(player, 'en');

  assert.ok(!captionsButton.hasClass('vjs-hidden'), 'The captions button is shown');
  assert.ok(englishTrack.mode === 'disabled', 'English track should be disabled');
  player.dispose();
});

QUnit.test('the user-selected language takes priority over default language', function(assert) {
  // The video has ‘English’ captions as default, but has ‘Spanish’ captions also
  const player = TestHelpers.makePlayer({techOrder: ['html5']});
  const track1 = {
    kind: 'captions',
    label: 'English',
    language: 'en',
    src: 'en.vtt',
    default: true
  };
  const track2 = {
    kind: 'captions',
    label: 'Spanish',
    language: 'es',
    src: 'es.vtt'
  };

  player.src({type: 'video/mp4', src: 'http://google.com'});
  // manualCleanUp = true by default
  player.addRemoteTextTrack(track1);
  player.addRemoteTextTrack(track2);
  // Force 'es' as user-selected track
  player.cache_.selectedLanguage = 'es';
  this.clock.tick(1);

  // the spanish captions track should be shown
  const englishTrack = getTrackByLanguage(player, 'en');
  const spanishTrack = getTrackByLanguage(player, 'es');

  assert.ok(spanishTrack.mode === 'showing', 'Spanish captions should be shown');
  assert.ok(englishTrack.mode === 'disabled', 'English captions should be hidden');
  player.dispose();
});

QUnit.test('the user-selected language is used for subsequent source changes', function(assert) {
  // Start with two captions tracks: English and Spanish
  const player = TestHelpers.makePlayer({techOrder: ['html5']});
  const track1 = {
    kind: 'captions',
    label: 'English',
    language: 'en',
    src: 'en.vtt'
  };
  const track2 = {
    kind: 'captions',
    label: 'Spanish',
    language: 'es',
    src: 'es.vtt'
  };
  const tracks = player.tech_.remoteTextTracks();
  const captionsButton = player.controlBar.getChild('SubsCapsButton');
  let esCaptionMenuItem;
  let enCaptionMenuItem;

  player.src({type: 'video/mp4', src: 'http://google.com'});
  // manualCleanUp = true by default
  player.addRemoteTextTrack(track1);
  player.addRemoteTextTrack(track2);

  // Keep track of menu items
  esCaptionMenuItem = getMenuItemByLanguage(captionsButton.items, 'es');
  enCaptionMenuItem = getMenuItemByLanguage(captionsButton.items, 'en');

  // The user chooses Spanish
  player.play();
  captionsButton.pressButton();
  esCaptionMenuItem.trigger('click');

  // Track mode changes on user-selection
  assert.ok(esCaptionMenuItem.track.mode === 'showing',
    'Spanish should be showing after selection');
  assert.ok(enCaptionMenuItem.track.mode === 'disabled',
    'English should be disabled after selecting Spanish');

  // Switch source and remove old tracks
  player.tech_.setSource({type: 'video/mp4', src: 'http://example.com'});
  while (tracks.length > 0) {
    player.removeRemoteTextTrack(tracks[0]);
  }
  // Add tracks for the new source
  player.addRemoteTextTrack(track1);
  player.addRemoteTextTrack(track2);

  // Make sure player ready handler runs
  this.clock.tick(1);

  // Keep track of menu items
  esCaptionMenuItem = getMenuItemByLanguage(captionsButton.items, 'es');
  enCaptionMenuItem = getMenuItemByLanguage(captionsButton.items, 'en');

  // The user-selection should have persisted
  assert.ok(esCaptionMenuItem.track.mode === 'showing',
    'Spanish should remain showing');
  assert.ok(enCaptionMenuItem.track.mode === 'disabled',
    'English should remain disabled');

  const englishTrack = getTrackByLanguage(player, 'en');
  const spanishTrack = getTrackByLanguage(player, 'es');

  assert.ok(spanishTrack.mode === 'showing', 'Spanish track remains showing');
  assert.ok(englishTrack.mode === 'disabled', 'English track remains disabled');
  player.dispose();
});
