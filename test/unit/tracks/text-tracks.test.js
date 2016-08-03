/* eslint-env qunit */
import ChaptersButton from '../../../src/js/control-bar/text-track-controls/chapters-button.js';
import DescriptionsButton from '../../../src/js/control-bar/text-track-controls/descriptions-button.js';
import SubtitlesButton from '../../../src/js/control-bar/text-track-controls/subtitles-button.js';
import CaptionsButton from '../../../src/js/control-bar/text-track-controls/captions-button.js';

import TextTrack from '../../../src/js/tracks/text-track.js';
import TextTrackDisplay from '../../../src/js/tracks/text-track-display.js';
import Html5 from '../../../src/js/tech/html5.js';
import Tech from '../../../src/js/tech/tech.js';
import Component from '../../../src/js/component.js';

import * as browser from '../../../src/js/utils/browser.js';
import TestHelpers from '../test-helpers.js';
import document from 'global/document';
import sinon from 'sinon';

QUnit.module('Tracks', {
  setup() {
    this.clock = sinon.useFakeTimers();
  },
  teardown() {
    this.clock.restore();
  }
});

QUnit.test('should place title list item into ul', function() {
  const player = TestHelpers.makePlayer();
  const chaptersButton = new ChaptersButton(player);

  const menuContentElement = chaptersButton.el().getElementsByTagName('UL')[0];
  const titleElement = menuContentElement.children[0];

  QUnit.ok(titleElement.innerHTML === 'Chapters', 'title element placed in ul');

  player.dispose();
});

QUnit.test('Player track methods call the tech', function() {
  const player = TestHelpers.makePlayer();
  let calls = 0;

  player.tech_.textTracks = function() {
    calls++;
  };
  player.tech_.addTextTrack = function() {
    calls++;
  };

  player.addTextTrack();
  player.textTracks();

  QUnit.equal(calls, 2, 'both textTrack and addTextTrack defer to the tech');

  player.dispose();
});

QUnit.test('TextTrackDisplay initializes tracks on player ready', function() {
  let calls = 0;
  /* eslint-disable no-unused-vars */
  const ttd = new TextTrackDisplay({
    on() {},
    addTextTracks() {
      calls--;
    },
    getChild() {
      calls--;
    },
    ready() {
      calls++;
    }
  }, {});
  /* eslint-enable no-unused-vars */

  QUnit.equal(calls, 1, 'only a player.ready call was made');
});

QUnit.test('listen to remove and add track events in native text tracks', function() {
  const oldTestVid = Html5.TEST_VID;
  const oldTextTracks = Html5.prototype.textTracks;
  const events = {};

  Html5.prototype.textTracks = function() {
    return {
      addEventListener(type, handler) {
        events[type] = true;
      }
    };
  };

  Html5.TEST_VID = {
    textTracks: []
  };

  const player = {
    // Function.prototype is a built-in no-op function.
    controls() {},
    ready() {},
    options() {
      return {};
    },
    addChild() {},
    id() {},
    el() {
      return {
        insertBefore() {},
        appendChild() {}
      };
    }
  };

  player.player_ = player;
  player.options_ = {};

  /* eslint-disable no-unused-vars */
  const html = new Html5({});
  /* eslint-enable no-unused-vars */

  QUnit.ok(events.removetrack, 'removetrack listener was added');
  QUnit.ok(events.addtrack, 'addtrack listener was added');

  Html5.TEST_VID = oldTestVid;
  Html5.prototype.textTracks = oldTextTracks;
});

QUnit.test('update texttrack buttons on removetrack or addtrack', function() {
  let update = 0;
  const events = {};
  const oldCaptionsUpdate = CaptionsButton.prototype.update;
  const oldSubsUpdate = SubtitlesButton.prototype.update;
  const oldDescriptionsUpdate = DescriptionsButton.prototype.update;
  const oldChaptersUpdate = ChaptersButton.prototype.update;

  CaptionsButton.prototype.update = function() {
    update++;
    oldCaptionsUpdate.call(this);
  };
  SubtitlesButton.prototype.update = function() {
    update++;
    oldSubsUpdate.call(this);
  };
  DescriptionsButton.prototype.update = function() {
    update++;
    oldDescriptionsUpdate.call(this);
  };
  ChaptersButton.prototype.update = function() {
    update++;
    oldChaptersUpdate.call(this);
  };

  Tech.prototype.featuresNativeTextTracks = true;

  const oldTextTracks = Tech.prototype.textTracks;

  Tech.prototype.textTracks = function() {
    return {
      length: 0,
      addEventListener(type, handler) {
        if (!events[type]) {
          events[type] = [];
        }
        events[type].push(handler);
      },
      // Requrired in player.dispose()
      removeEventListener() {}
    };
  };

  const tag = document.createElement('video');
  const track1 = document.createElement('track');
  const track2 = document.createElement('track');

  track1.kind = 'captions';
  track1.label = 'en';
  track1.language = 'English';
  track1.src = '#en.vtt';
  tag.appendChild(track1);

  track2.kind = 'captions';
  track2.label = 'es';
  track2.language = 'Spanish';
  track2.src = '#es.vtt';
  tag.appendChild(track2);

  const player = TestHelpers.makePlayer({}, tag);

  player.player_ = player;

  QUnit.equal(update, 4, 'update was called on the four buttons during init');

  for (let i = 0; i < events.removetrack.length; i++) {
    events.removetrack[i]();
  }

  QUnit.equal(update, 8, 'update was called on the four buttons for remove track');

  for (let i = 0; i < events.addtrack.length; i++) {
    events.addtrack[i]();
  }

  QUnit.equal(update, 12, 'update was called on the four buttons for remove track');

  Tech.prototype.textTracks = oldTextTracks;
  Tech.prototype.featuresNativeTextTracks = false;
  CaptionsButton.prototype.update = oldCaptionsUpdate;
  SubtitlesButton.prototype.update = oldSubsUpdate;
  ChaptersButton.prototype.update = oldChaptersUpdate;

  player.dispose();
});

QUnit.test('if native text tracks are not supported, create a texttrackdisplay', function() {
  const oldTestVid = Html5.TEST_VID;
  const oldIsFirefox = browser.IS_FIREFOX;
  const oldTextTrackDisplay = Component.getComponent('TextTrackDisplay');
  let called = false;
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
  Component.registerComponent('TextTrackDisplay', function() {
    called = true;
  });

  const player = TestHelpers.makePlayer({}, tag);

  QUnit.ok(called, 'text track display was created');

  Html5.TEST_VID = oldTestVid;
  browser.IS_FIREFOX = oldIsFirefox;
  Component.registerComponent('TextTrackDisplay', oldTextTrackDisplay);

  player.dispose();
});

QUnit.test('html5 tech supports native text tracks if the video supports it, unless mode is a number', function() {
  const oldTestVid = Html5.TEST_VID;

  Html5.TEST_VID = {
    textTracks: [{
      mode: 0
    }]
  };

  QUnit.ok(!Html5.supportsNativeTextTracks(),
           'native text tracks are not supported if mode is a number');

  Html5.TEST_VID = oldTestVid;
});

QUnit.test('html5 tech supports native text tracks if the video supports it, unless it is firefox', function() {
  const oldTestVid = Html5.TEST_VID;
  const oldIsFirefox = browser.IS_FIREFOX;

  Html5.TEST_VID = {
    textTracks: []
  };

  browser.IS_FIREFOX = true;

  QUnit.ok(!Html5.supportsNativeTextTracks(),
           'if textTracks are available on video element,' +
           ' native text tracks are supported');

  Html5.TEST_VID = oldTestVid;
  browser.IS_FIREFOX = oldIsFirefox;
});

QUnit.test('when switching techs, we should not get a new text track', function() {
  const player = TestHelpers.makePlayer();

  player.loadTech_('TechFaker');
  const firstTracks = player.textTracks();

  player.loadTech_('TechFaker');
  const secondTracks = player.textTracks();

  QUnit.ok(firstTracks === secondTracks, 'the tracks are equal');
});

if (Html5.supportsNativeTextTracks()) {
  QUnit.test('listen to native remove and add track events in native text tracks', function(assert) {
    const done = assert.async();

    const el = document.createElement('video');
    const html = new Html5({el});
    const tt = el.textTracks;
    const emulatedTt = html.textTracks();
    const track = document.createElement('track');

    el.appendChild(track);

    const addtrack = function() {
      QUnit.equal(emulatedTt.length, tt.length, 'we have matching tracks length');
      QUnit.equal(emulatedTt.length, 1, 'we have one text track');

      emulatedTt.off('addtrack', addtrack);
      el.removeChild(track);
    };

    emulatedTt.on('addtrack', addtrack);
    emulatedTt.on('removetrack', function() {
      QUnit.equal(emulatedTt.length, tt.length, 'we have matching tracks length');
      QUnit.equal(emulatedTt.length, 0, 'we have no more text tracks');
      done();
    });
  });

  QUnit.test('should have removed tracks on dispose', function(assert) {
    const done = assert.async();

    const el = document.createElement('video');
    const html = new Html5({el});
    const tt = el.textTracks;
    const emulatedTt = html.textTracks();
    const track = document.createElement('track');

    el.appendChild(track);

    const addtrack = function() {
      QUnit.equal(emulatedTt.length, tt.length, 'we have matching tracks length');
      QUnit.equal(emulatedTt.length, 1, 'we have one text track');

      emulatedTt.off('addtrack', addtrack);
      html.dispose();

      QUnit.equal(emulatedTt.length, tt.length, 'we have matching tracks length');
      QUnit.equal(emulatedTt.length, 0, 'we have no more text tracks');

      done();
    };

    emulatedTt.on('addtrack', addtrack);
  });
}

QUnit.test('should check for text track changes when emulating text tracks', function() {
  const tech = new Tech();
  let numTextTrackChanges = 0;

  tech.on('texttrackchange', function() {
    numTextTrackChanges++;
  });
  tech.emulateTextTracks();
  QUnit.equal(numTextTrackChanges, 1, 'we got a texttrackchange event');
});

QUnit.test('removes cuechange event when text track is hidden for emulated tracks', function() {
  const player = TestHelpers.makePlayer();
  const tt = new TextTrack({
    tech: player.tech_,
    mode: 'showing'
  });

  tt.addCue({
    id: '1',
    startTime: 2,
    endTime: 5
  });
  player.tech_.textTracks().addTrack_(tt);
  player.tech_.emulateTextTracks();

  let numTextTrackChanges = 0;

  player.tech_.on('texttrackchange', function() {
    numTextTrackChanges++;
  });

  tt.mode = 'showing';
  QUnit.equal(numTextTrackChanges, 1,
    'texttrackchange should be called once for mode change');
  tt.mode = 'showing';
  QUnit.equal(numTextTrackChanges, 2,
    'texttrackchange should be called once for mode change');

  player.tech_.currentTime = function() {
    return 3;
  };
  player.tech_.trigger('timeupdate');
  QUnit.equal(numTextTrackChanges, 3,
    'texttrackchange should be triggered once for the cuechange');

  tt.mode = 'hidden';
  QUnit.equal(numTextTrackChanges, 4,
    'texttrackchange should be called once for the mode change');

  player.tech_.currentTime = function() {
    return 7;
  };
  player.tech_.trigger('timeupdate');
  QUnit.equal(numTextTrackChanges, 4,
    'texttrackchange should be not be called since mode is hidden');
});

QUnit.test('should return correct remote text track values', function() {
  const fixture = document.getElementById('qunit-fixture');
  const html = `
    <video id="example_1" class="video-js" autoplay preload="none">
      <source src="http://google.com" type="video/mp4">
      <source src="http://google.com" type="video/webm">
      <track kind="captions" label="label">
    </video>
  `;

  fixture.innerHTML += html;
  const tag = document.getElementById('example_1');
  const player = TestHelpers.makePlayer({}, tag);

  this.clock.tick(1);

  QUnit.equal(player.remoteTextTracks().length, 1, 'add text track via html');
  QUnit.equal(player.remoteTextTrackEls().length, 1, 'add html track element via html');

  const htmlTrackElement = player.addRemoteTextTrack({
    kind: 'captions',
    label: 'label'
  });

  QUnit.equal(player.remoteTextTracks().length, 2, 'add text track via method');
  QUnit.equal(player.remoteTextTrackEls().length, 2, 'add html track element via method');

  player.removeRemoteTextTrack(htmlTrackElement.track);

  QUnit.equal(player.remoteTextTracks().length, 1, 'remove text track via method');
  QUnit.equal(player.remoteTextTrackEls().length,
              1,
              'remove html track element via method');

  player.dispose();
});

QUnit.test('should uniformly create html track element when adding text track', function() {
  const player = TestHelpers.makePlayer();
  const track = {
    kind: 'kind',
    src: 'src',
    language: 'language',
    label: 'label',
    default: 'default'
  };

  QUnit.equal(player.remoteTextTrackEls().length, 0, 'no html text tracks');

  const htmlTrackElement = player.addRemoteTextTrack(track);

  QUnit.equal(htmlTrackElement.kind,
              htmlTrackElement.track.kind,
              'verify html track element kind');
  QUnit.equal(htmlTrackElement.src,
              htmlTrackElement.track.src,
              'verify html track element src');
  QUnit.equal(htmlTrackElement.srclang,
              htmlTrackElement.track.language,
              'verify html track element language');
  QUnit.equal(htmlTrackElement.label,
              htmlTrackElement.track.label,
              'verify html track element label');
  QUnit.equal(htmlTrackElement.default,
              htmlTrackElement.track.default,
              'verify html track element default');

  QUnit.equal(player.remoteTextTrackEls().length, 1, 'html track element exist');
  QUnit.equal(player.remoteTextTrackEls().getTrackElementByTrack_(htmlTrackElement.track),
              htmlTrackElement,
              'verify same html track element');

  player.dispose();
});

QUnit.test('default text tracks should show by default', function() {
  const tag = TestHelpers.makeTag();
  const capt = document.createElement('track');

  capt.setAttribute('kind', 'captions');
  capt.setAttribute('default', 'default');

  tag.appendChild(capt);

  const player = TestHelpers.makePlayer({
    html5: {
      nativeTextTracks: false
    }
  }, tag);

  // native tracks are initialized after the player is ready
  this.clock.tick(1);

  const tracks = player.textTracks();

  QUnit.equal(tracks[0].kind, 'captions', 'the captions track is present');
  QUnit.equal(tracks[0].mode, 'showing', 'the captions track is showing');
});

QUnit.test('default captions take precedence over default descriptions', function() {
  const tag = TestHelpers.makeTag();
  const desc = document.createElement('track');
  const capt = document.createElement('track');

  desc.setAttribute('kind', 'descriptions');
  desc.setAttribute('default', 'default');
  capt.setAttribute('kind', 'captions');
  capt.setAttribute('default', 'default');

  tag.appendChild(desc);
  tag.appendChild(capt);

  const player = TestHelpers.makePlayer({
    html5: {
      nativeTextTracks: false
    }
  }, tag);

  // native tracks are initialized after the player is ready
  this.clock.tick(1);

  const tracks = player.textTracks();

  QUnit.equal(tracks[0].kind, 'descriptions', 'the descriptions track is first');
  QUnit.equal(tracks[0].mode, 'disabled', 'the descriptions track is disabled');
  QUnit.equal(tracks[1].kind, 'captions', 'the captions track is second');
  QUnit.equal(tracks[1].mode, 'showing', 'the captions track is showing');
});

QUnit.test('removeRemoteTextTrack should be able to take both a track and the response from addRemoteTextTrack', function() {
  const player = TestHelpers.makePlayer();
  const track = {
    kind: 'kind',
    src: 'src',
    language: 'language',
    label: 'label',
    default: 'default'
  };
  let htmlTrackElement = player.addRemoteTextTrack(track);

  QUnit.equal(player.remoteTextTrackEls().length, 1, 'html track element exist');

  player.removeRemoteTextTrack(htmlTrackElement);

  QUnit.equal(player.remoteTextTrackEls().length,
              0,
              'the track element was removed correctly');

  htmlTrackElement = player.addRemoteTextTrack(track);
  QUnit.equal(player.remoteTextTrackEls().length, 1, 'html track element exist');

  player.removeRemoteTextTrack(htmlTrackElement.track);
  QUnit.equal(player.remoteTextTrackEls().length,
              0,
              'the track element was removed correctly');
});
