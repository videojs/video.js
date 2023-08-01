/* eslint-env qunit */
import window from 'global/window';
import Html5 from '../../../src/js/tech/html5.js';
import { constructColor } from '../../../src/js/tracks/text-track-display.js';
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

  browser.stub_IS_FIREFOX(true);

  const fakeTTDSpy = sinon.spy();

  class FakeTTD extends Component {
    constructor(player, options) {
      super(player, options);
      fakeTTDSpy();
    }
  }

  Component.registerComponent('TextTrackDisplay', FakeTTD);

  const player = TestHelpers.makePlayer({}, tag);

  assert.strictEqual(fakeTTDSpy.callCount, 1, 'text track display was created');

  Html5.TEST_VID = oldTestVid;
  browser.stub_IS_FIREFOX(oldIsFirefox);
  Component.registerComponent('TextTrackDisplay', oldTextTrackDisplay);

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
  const englishTrack = player.addRemoteTextTrack(track1, true).track;
  const spanishTrack = player.addRemoteTextTrack(track2, true).track;

  // Make sure the ready handler runs
  this.clock.tick(1);

  assert.ok(englishTrack.mode === 'showing', 'English track should be showing');
  assert.ok(spanishTrack.mode === 'disabled', 'Spanish track should not be showing');
  player.dispose();
});

if (!Html5.supportsNativeTextTracks()) {
  QUnit.test('text track display should attach screen orientation change event handler', function(assert) {
    const oldScreen = window.screen;
    const removeHandlerSpy = sinon.spy();
    let changeHandlerSpy;
    let changeHandlerAttached;

    window.screen = {
      orientation: {
        addEventListener: (type, func) => {
          changeHandlerAttached = true;
          changeHandlerSpy = sinon.spy();
        },
        dispatchEvent: (type) => changeHandlerSpy(),
        removeEventListener: removeHandlerSpy
      }
    };

    const player = TestHelpers.makePlayer();

    this.clock.tick(1);

    assert.true(changeHandlerAttached, 'screen orientation change event handler was not attached');
    assert.strictEqual(changeHandlerSpy.callCount, 0, 'screen orientation change event handler should not be called');

    window.screen.orientation.dispatchEvent('change');

    assert.strictEqual(changeHandlerSpy.callCount, 1, 'screen orientation change event handler was not called');

    player.dispose();

    assert.strictEqual(
      removeHandlerSpy.callCount,
      1,
      'screen orientation change event handler was not removed during player dispose'
    );
    window.screen = oldScreen;
  });

  QUnit.test('selectedlanguagechange is triggered by a track mode change', function(assert) {
    const player = TestHelpers.makePlayer();
    const track1 = {
      kind: 'captions',
      label: 'English',
      language: 'en',
      src: 'en.vtt'
    };
    const spy = sinon.spy();
    const selectedLanguageHandler = function(event) {
      spy();
    };
    const englishTrack = player.addRemoteTextTrack(track1, true).track;

    player.textTracks().addEventListener('selectedlanguagechange', selectedLanguageHandler);
    englishTrack.mode = 'showing';

    assert.strictEqual(spy.callCount, 1, 'selectedlanguagechange event was fired');
    player.dispose();
    player.textTracks().removeEventListener('selectedlanguagechange', selectedLanguageHandler);
  });

  QUnit.test("if user-selected language is unavailable, don't pick a track to show", function(assert) {
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
    const englishTrack = player.addRemoteTextTrack(track1, true).track;

    // Force 'es' as user-selected track
    player.cache_.selectedLanguage = { language: 'es', kind: 'captions' };

    this.clock.tick(1);
    player.play();

    assert.ok(!captionsButton.hasClass('vjs-hidden'), 'The captions button is shown');
    assert.ok(englishTrack.mode === 'disabled', 'English track should be disabled');
    player.dispose();
  });

  QUnit.test('the user-selected language takes priority over default language', function(assert) {
    // The video has ‘English’ captions as default, but has ‘Spanish’ captions also
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

    player.src({type: 'video/mp4', src: 'http://google.com'});
    // manualCleanUp = true by default
    const englishTrack = player.addRemoteTextTrack(track1, true).track;
    const spanishTrack = player.addRemoteTextTrack(track2, true).track;

    // Force 'es' as user-selected track
    player.cache_.selectedLanguage = { enabled: true, language: 'es', kind: 'captions' };
    this.clock.tick(1);

    assert.ok(spanishTrack.mode === 'showing', 'Spanish captions should be shown');
    assert.ok(englishTrack.mode === 'disabled', 'English captions should be hidden');
    player.dispose();
  });

  QUnit.test("don't select user language if it is an empty string", function(assert) {
    const player = TestHelpers.makePlayer();
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
    const track3 = {
      kind: 'metadata',
      label: 'segment-metadata'
    };

    player.src({type: 'video/mp4', src: 'http://google.com'});
    // manualCleanUp = true by default
    const englishTrack = player.addRemoteTextTrack(track1, true).track;
    const spanishTrack = player.addRemoteTextTrack(track2, true).track;
    const metadataTrack = player.addRemoteTextTrack(track3, true).track;

    // Force empty string ('') as "user-selected" track
    player.cache_.selectedLanguage = { enabled: true, language: '', kind: 'captions' };
    this.clock.tick(1);

    assert.equal(spanishTrack.mode, 'disabled', 'Spanish captions should be disabled');
    assert.equal(englishTrack.mode, 'disabled', 'English captions should be disabled');
    assert.notEqual(metadataTrack.mode, 'showing', 'Metadata track should not be showing');

    // Force es as "user-selected" track
    player.cache_.selectedLanguage = { enabled: true, language: 'es', kind: 'captions' };
    player.trigger('loadedmetadata');

    assert.equal(spanishTrack.mode, 'showing', 'Spanish captions should be showing');
    assert.equal(englishTrack.mode, 'disabled', 'English captions should be disabled');
    assert.notEqual(metadataTrack.mode, 'showing', 'Metadata track should not be showing');

    player.dispose();
  });

  QUnit.test("matching both the selectedLanguage's language and kind takes priority over just matching the language", function(assert) {
    const player = TestHelpers.makePlayer();
    const track1 = {
      kind: 'captions',
      label: 'English',
      language: 'en',
      src: 'en.vtt'
    };
    const track2 = {
      kind: 'subtitles',
      label: 'English',
      language: 'en',
      src: 'en.vtt'
    };

    player.src({type: 'video/mp4', src: 'http://google.com'});
    // manualCleanUp = true by default
    const captionTrack = player.addRemoteTextTrack(track1, true).track;
    const subsTrack = player.addRemoteTextTrack(track2, true).track;

    // Force English captions as user-selected track
    player.cache_.selectedLanguage = { enabled: true, language: 'en', kind: 'captions' };
    this.clock.tick(1);

    assert.ok(captionTrack.mode === 'showing', 'Captions track should be preselected');
    assert.ok(subsTrack.mode === 'disabled', 'Subtitles track should remain disabled');
    player.dispose();
  });

  QUnit.test('the user-selected language is used for subsequent source changes', function(assert) {
    // Start with two captions tracks: English and Spanish
    const player = TestHelpers.makePlayer();
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
    player.addRemoteTextTrack(track1, true);
    player.addRemoteTextTrack(track2, true);

    // Keep track of menu items
    esCaptionMenuItem = getMenuItemByLanguage(captionsButton.items, 'es');
    enCaptionMenuItem = getMenuItemByLanguage(captionsButton.items, 'en');

    // The user chooses Spanish
    player.play();
    esCaptionMenuItem.trigger('click');

    // Track mode changes on user-selection
    assert.ok(
      esCaptionMenuItem.track.mode === 'showing',
      'Spanish should be showing after selection'
    );
    assert.ok(
      enCaptionMenuItem.track.mode === 'disabled',
      'English should be disabled after selecting Spanish'
    );
    assert.deepEqual(
      player.cache_.selectedLanguage,
      { enabled: true, language: 'es', kind: 'captions' }
    );

    // Switch source and remove old tracks
    player.tech_.src({type: 'video/mp4', src: 'http://example.com'});
    while (tracks.length > 0) {
      player.removeRemoteTextTrack(tracks[0]);
    }
    // Add tracks for the new source
    // change the kind of track to subtitles
    track1.kind = 'subtitles';
    track2.kind = 'subtitles';
    const englishTrack = player.addRemoteTextTrack(track1, true).track;
    const spanishTrack = player.addRemoteTextTrack(track2, true).track;

    // Make sure player ready handler runs
    this.clock.tick(1);

    // Keep track of menu items
    esCaptionMenuItem = getMenuItemByLanguage(captionsButton.items, 'es');
    enCaptionMenuItem = getMenuItemByLanguage(captionsButton.items, 'en');

    // The user-selection should have persisted
    assert.ok(
      esCaptionMenuItem.track.mode === 'showing',
      'Spanish should remain showing'
    );
    assert.ok(
      enCaptionMenuItem.track.mode === 'disabled',
      'English should remain disabled'
    );
    assert.deepEqual(
      player.cache_.selectedLanguage,
      { enabled: true, language: 'es', kind: 'captions' }
    );

    assert.ok(spanishTrack.mode === 'showing', 'Spanish track remains showing');
    assert.ok(englishTrack.mode === 'disabled', 'English track remains disabled');
    player.dispose();
  });

  QUnit.test('the user-selected language is cleared on turning off captions', function(assert) {
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
    const englishTrack = player.addRemoteTextTrack(track1, true).track;
    // Keep track of menu items
    const enCaptionMenuItem = getMenuItemByLanguage(captionsButton.items, 'en');
    // we know the position of the OffTextTrackMenuItem
    const offMenuItem = captionsButton.items[1];

    // Select English initially
    player.play();
    enCaptionMenuItem.trigger('click');

    assert.deepEqual(
      player.cache_.selectedLanguage,
      { enabled: true, language: 'en', kind: 'captions' }, 'English track is selected'
    );
    assert.ok(englishTrack.mode === 'showing', 'English track should be showing');

    // Select the off button
    offMenuItem.trigger('click');

    assert.deepEqual(
      player.cache_.selectedLanguage,
      { enabled: false }, 'selectedLanguage is cleared'
    );
    assert.ok(englishTrack.mode === 'disabled', 'English track is disabled');
    player.dispose();
  });

  QUnit.test('a color can be constructed from a three digit hex code', function(assert) {
    const hex = '#f0e';

    // f gets mapped to ff -> 255 in decimal,
    // 0 gets mapped to 00 -> 0 in decimal,
    // e gets mapped to ee -> 238 in decimal.
    assert.equal(constructColor(hex, 1), 'rgba(255,0,238,1)');
  });

  QUnit.test('a color can be constructed from a six digit hex code', function(assert) {
    const hex = '#f604e2';

    // f6 -> 246 in decimal,
    // 04 -> 4 in decimal,
    // e2 -> 226 in decimal.
    assert.equal(constructColor(hex, 1), 'rgba(246,4,226,1)');
  });

  QUnit.test('an invalid hex code will throw an error', function(assert) {
    const hex = '#f';

    assert.throws(
      function() {
        constructColor(hex, 1);
      },
      new Error('Invalid color code provided, #f; must be formatted as e.g. #f0e or #f604e2.'),
      'colors must be valid hex codes.'
    );
  });

  const skipOnOldChrome = window.CSS.supports('inset-inline: 10px') ? 'test' : 'skip';

  QUnit[skipOnOldChrome]('text track display should overlay a video', function(assert) {
    const tag = document.createElement('video');

    tag.width = 320;
    tag.height = 180;
    const player = TestHelpers.makePlayer({}, tag);
    const textTrackDisplay = player.getChild('TextTrackDisplay');
    const textTrackDisplayStyle = textTrackDisplay.el().style;

    assert.ok(textTrackDisplayStyle.insetInline === '', 'text track display style insetInline equal to empty string');
    assert.ok(textTrackDisplayStyle.insetBlock === '', 'text track display style insetBlock equal to empty string');

    // video aspect ratio equal to NaN
    player.tech_.videoWidth = () => 0;
    player.tech_.videoHeight = () => 0;

    assert.ok(textTrackDisplayStyle.insetInline === '', 'text track display style insetInline equal to empty string');
    assert.ok(textTrackDisplayStyle.insetBlock === '', 'text track display style insetBlock equal to empty string');

    // video aspect ratio 2:1
    player.tech_.videoWidth = () => 100;
    player.tech_.videoHeight = () => 50;

    textTrackDisplay.updateDisplayOverlay();

    assert.ok(textTrackDisplayStyle.insetInline === '', 'text track display style insetInline equal to empty string');
    assert.ok(textTrackDisplayStyle.insetBlock === '10px', 'text track display style insetBlock equal to 10px');

    // video aspect ratio 4:3
    player.tech_.videoWidth = () => 100;
    player.tech_.videoHeight = () => 75;

    textTrackDisplay.updateDisplayOverlay();

    assert.ok(textTrackDisplayStyle.insetInline === '40px', 'text track display style insetInline equal to 40px');
    assert.ok(textTrackDisplayStyle.insetBlock === '', 'text track display style insetBlock equal to empty string');

    // video aspect ratio 16:9
    player.tech_.videoWidth = () => 320;
    player.tech_.videoHeight = () => 180;

    textTrackDisplay.updateDisplayOverlay();

    assert.ok(textTrackDisplayStyle.insetInline === '', 'text track display style insetInline equal to empty string');
    assert.ok(textTrackDisplayStyle.insetBlock === '', 'text track display style insetBlock equal to empty string');

    player.dispose();
  });
}
