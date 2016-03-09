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

q.module('Tracks', {
  setup() {
    this.clock = sinon.useFakeTimers();
  },
  teardown() {
    this.clock.restore();
  }
});

test('should place title list item into ul', function() {
  let player;
  let chaptersButton;

  player = TestHelpers.makePlayer();

  chaptersButton = new ChaptersButton(player);

  let menuContentElement = chaptersButton.el().getElementsByTagName('UL')[0];
  let titleElement = menuContentElement.children[0];

  ok(titleElement.innerHTML === 'Chapters', 'title element placed in ul');

  player.dispose();
});

test('Player track methods call the tech', function() {
  let player;
  let calls = 0;

  player = TestHelpers.makePlayer();

  player.tech_.textTracks = function() {
    calls++;
  };
  player.tech_.addTextTrack = function() {
    calls++;
  };

  player.addTextTrack();
  player.textTracks();

  equal(calls, 2, 'both textTrack and addTextTrack defer to the tech');

  player.dispose();
});

test('TextTrackDisplay initializes tracks on player ready', function() {
  let calls = 0;
  let ttd = new TextTrackDisplay({
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

  equal(calls, 1, 'only a player.ready call was made');
});

test('listen to remove and add track events in native text tracks', function() {
  let oldTestVid = Html5.TEST_VID;
  let player;
  let options;
  let oldTextTracks = Html5.prototype.textTracks;
  let events = {};
  let html;

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

  player = {
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
  player.options_ = options = {};

  html = new Html5(options);

  ok(events.removetrack, 'removetrack listener was added');
  ok(events.addtrack, 'addtrack listener was added');

  Html5.TEST_VID = oldTestVid;
  Html5.prototype.textTracks = oldTextTracks;
});

test('update texttrack buttons on removetrack or addtrack', function() {
  let update = 0;
  let i;
  let player;
  let tag;
  let track;
  let oldTextTracks;
  let events = {};
  let oldCaptionsUpdate;
  let oldSubsUpdate;
  let oldChaptersUpdate;
  let oldDescriptionsUpdate;

  oldCaptionsUpdate = CaptionsButton.prototype.update;
  oldSubsUpdate = SubtitlesButton.prototype.update;
  oldDescriptionsUpdate = DescriptionsButton.prototype.update;
  oldChaptersUpdate = ChaptersButton.prototype.update;
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
  oldTextTracks = Tech.prototype.textTracks;
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

  tag = document.createElement('video');
  track = document.createElement('track');
  track.kind = 'captions';
  track.label = 'en';
  track.language = 'English';
  track.src = '#en.vtt';
  tag.appendChild(track);
  track = document.createElement('track');
  track.kind = 'captions';
  track.label = 'es';
  track.language = 'Spanish';
  track.src = '#es.vtt';
  tag.appendChild(track);

  player = TestHelpers.makePlayer({}, tag);

  player.player_ = player;

  equal(update, 4, 'update was called on the four buttons during init');

  for (i = 0; i < events.removetrack.length; i++) {
    events.removetrack[i]();
  }

  equal(update, 8, 'update was called on the four buttons for remove track');

  for (i = 0; i < events.addtrack.length; i++) {
    events.addtrack[i]();
  }

  equal(update, 12, 'update was called on the four buttons for remove track');

  Tech.prototype.textTracks = oldTextTracks;
  Tech.prototype.featuresNativeTextTracks = false;
  CaptionsButton.prototype.update = oldCaptionsUpdate;
  SubtitlesButton.prototype.update = oldSubsUpdate;
  ChaptersButton.prototype.update = oldChaptersUpdate;

  player.dispose();
});

test('if native text tracks are not supported, create a texttrackdisplay', function() {
  let oldTestVid = Html5.TEST_VID;
  let oldIsFirefox = browser.IS_FIREFOX;
  let oldTextTrackDisplay = Component.getComponent('TextTrackDisplay');
  let called = false;
  let player;
  let tag;
  let track;

  tag = document.createElement('video');
  track = document.createElement('track');
  track.kind = 'captions';
  track.label = 'en';
  track.language = 'English';
  track.src = 'en.vtt';
  tag.appendChild(track);
  track = document.createElement('track');
  track.kind = 'captions';
  track.label = 'es';
  track.language = 'Spanish';
  track.src = 'es.vtt';
  tag.appendChild(track);

  Html5.TEST_VID = {
    textTracks: []
  };

  browser.IS_FIREFOX = true;
  Component.registerComponent('TextTrackDisplay', function() {
    called = true;
  });

  player = TestHelpers.makePlayer({}, tag);

  ok(called, 'text track display was created');

  Html5.TEST_VID = oldTestVid;
  browser.IS_FIREFOX = oldIsFirefox;
  Component.registerComponent('TextTrackDisplay', oldTextTrackDisplay);

  player.dispose();
});

test('html5 tech supports native text tracks if the video supports it, unless mode is a number', function() {
  let oldTestVid = Html5.TEST_VID;

  Html5.TEST_VID = {
    textTracks: [{
      mode: 0
    }]
  };

  ok(!Html5.supportsNativeTextTracks(), 'native text tracks are not supported if mode is a number');

  Html5.TEST_VID = oldTestVid;
});

test('html5 tech supports native text tracks if the video supports it, unless it is firefox', function() {
  let oldTestVid = Html5.TEST_VID;
  let oldIsFirefox = browser.IS_FIREFOX;

  Html5.TEST_VID = {
    textTracks: []
  };

  browser.IS_FIREFOX = true;

  ok(!Html5.supportsNativeTextTracks(), 'if textTracks are available on video element, native text tracks are supported');

  Html5.TEST_VID = oldTestVid;
  browser.IS_FIREFOX = oldIsFirefox;
});

test('when switching techs, we should not get a new text track', function() {
  let player = TestHelpers.makePlayer();

  player.loadTech_('TechFaker');
  let firstTracks = player.textTracks();

  player.loadTech_('TechFaker');
  let secondTracks = player.textTracks();

  ok(firstTracks === secondTracks, 'the tracks are equal');
});

if (Html5.supportsNativeTextTracks()) {
  test('listen to native remove and add track events in native text tracks', function(assert) {
    let done = assert.async();

    let el = document.createElement('video');
    let html = new Html5({el});
    let tt = el.textTracks;
    let emulatedTt = html.textTracks();
    let track = document.createElement('track');

    el.appendChild(track);

    let addtrack = function() {
      equal(emulatedTt.length, tt.length, 'we have matching tracks length');
      equal(emulatedTt.length, 1, 'we have one text track');

      emulatedTt.off('addtrack', addtrack);
      el.removeChild(track);
    };

    emulatedTt.on('addtrack', addtrack);
    emulatedTt.on('removetrack', function() {
      equal(emulatedTt.length, tt.length, 'we have matching tracks length');
      equal(emulatedTt.length, 0, 'we have no more text tracks');
      done();
    });
  });

  test('should have removed tracks on dispose', function(assert) {
    let done = assert.async();

    let el = document.createElement('video');
    let html = new Html5({el});
    let tt = el.textTracks;
    let emulatedTt = html.textTracks();
    let track = document.createElement('track');

    el.appendChild(track);

    let addtrack = function() {
      equal(emulatedTt.length, tt.length, 'we have matching tracks length');
      equal(emulatedTt.length, 1, 'we have one text track');

      emulatedTt.off('addtrack', addtrack);
      html.dispose();

      equal(emulatedTt.length, tt.length, 'we have matching tracks length');
      equal(emulatedTt.length, 0, 'we have no more text tracks');

      done();
    };

    emulatedTt.on('addtrack', addtrack);
  });
}

test('should check for text track changes when emulating text tracks', function() {
  let tech = new Tech();
  let numTextTrackChanges = 0;

  tech.on('texttrackchange', function() {
    numTextTrackChanges++;
  });
  tech.emulateTextTracks();
  equal(numTextTrackChanges, 1, 'we got a texttrackchange event');
});

test('removes cuechange event when text track is hidden for emulated tracks', function() {
  let player = TestHelpers.makePlayer();
  let tt = new TextTrack({
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
  equal(numTextTrackChanges, 1,
    'texttrackchange should be called once for mode change');
  tt.mode = 'showing';
  equal(numTextTrackChanges, 2,
    'texttrackchange should be called once for mode change');

  player.tech_.currentTime = function() {
    return 3;
  };
  player.tech_.trigger('timeupdate');
  equal(numTextTrackChanges, 3,
    'texttrackchange should be triggered once for the cuechange');

  tt.mode = 'hidden';
  equal(numTextTrackChanges, 4,
    'texttrackchange should be called once for the mode change');

  player.tech_.currentTime = function() {
    return 7;
  };
  player.tech_.trigger('timeupdate');
  equal(numTextTrackChanges, 4,
    'texttrackchange should be not be called since mode is hidden');
});

test('should return correct remote text track values', function() {
  let fixture = document.getElementById('qunit-fixture');
  let html = `
    <video id="example_1" class="video-js" autoplay preload="none">
      <source src="http://google.com" type="video/mp4">
      <source src="http://google.com" type="video/webm">
      <track kind="captions" label="label">
    </video>
  `;

  fixture.innerHTML += html;
  let tag = document.getElementById('example_1');
  let player = TestHelpers.makePlayer({}, tag);

  this.clock.tick(1);

  equal(player.remoteTextTracks().length, 1, 'add text track via html');
  equal(player.remoteTextTrackEls().length, 1, 'add html track element via html');

  let htmlTrackElement = player.addRemoteTextTrack({
    kind: 'captions',
    label: 'label'
  });

  equal(player.remoteTextTracks().length, 2, 'add text track via method');
  equal(player.remoteTextTrackEls().length, 2, 'add html track element via method');

  player.removeRemoteTextTrack(htmlTrackElement.track);

  equal(player.remoteTextTracks().length, 1, 'remove text track via method');
  equal(player.remoteTextTrackEls().length, 1, 'remove html track element via method');

  player.dispose();
});

test('should uniformly create html track element when adding text track', function() {
  let player = TestHelpers.makePlayer();
  let track = {
    kind: 'kind',
    src: 'src',
    language: 'language',
    label: 'label',
    default: 'default'
  };

  equal(player.remoteTextTrackEls().length, 0, 'no html text tracks');

  let htmlTrackElement = player.addRemoteTextTrack(track);

  equal(htmlTrackElement.kind, htmlTrackElement.track.kind, 'verify html track element kind');
  equal(htmlTrackElement.src, htmlTrackElement.track.src, 'verify html track element src');
  equal(htmlTrackElement.srclang, htmlTrackElement.track.language, 'verify html track element language');
  equal(htmlTrackElement.label, htmlTrackElement.track.label, 'verify html track element label');
  equal(htmlTrackElement.default, htmlTrackElement.track.default, 'verify html track element default');

  equal(player.remoteTextTrackEls().length, 1, 'html track element exist');
  equal(player.remoteTextTrackEls().getTrackElementByTrack_(htmlTrackElement.track), htmlTrackElement, 'verify same html track element');

  player.dispose();
});

test('default text tracks should show by default', function() {
  let tag = TestHelpers.makeTag();
  let capt = document.createElement('track');

  capt.setAttribute('kind', 'captions');
  capt.setAttribute('default', 'default');

  tag.appendChild(capt);

  let player = TestHelpers.makePlayer({
    html5: {
      nativeTextTracks: false
    }
  }, tag);

  // native tracks are initialized after the player is ready
  this.clock.tick(1);

  let tracks = player.textTracks();

  equal(tracks[0].kind, 'captions', 'the captions track is present');
  equal(tracks[0].mode, 'showing', 'the captions track is showing');
});

test('default captions take precedence over default descriptions', function() {
  let tag = TestHelpers.makeTag();
  let desc = document.createElement('track');
  let capt = document.createElement('track');

  desc.setAttribute('kind', 'descriptions');
  desc.setAttribute('default', 'default');
  capt.setAttribute('kind', 'captions');
  capt.setAttribute('default', 'default');

  tag.appendChild(desc);
  tag.appendChild(capt);

  let player = TestHelpers.makePlayer({
    html5: {
      nativeTextTracks: false
    }
  }, tag);

  // native tracks are initialized after the player is ready
  this.clock.tick(1);

  let tracks = player.textTracks();

  equal(tracks[0].kind, 'descriptions', 'the descriptions track is first');
  equal(tracks[0].mode, 'disabled', 'the descriptions track is disabled');
  equal(tracks[1].kind, 'captions', 'the captions track is second');
  equal(tracks[1].mode, 'showing', 'the captions track is showing');
});

test('removeRemoteTextTrack should be able to take both a track and the response from addRemoteTextTrack', function() {
  let player = TestHelpers.makePlayer();
  let track = {
    kind: 'kind',
    src: 'src',
    language: 'language',
    label: 'label',
    default: 'default'
  };
  let htmlTrackElement = player.addRemoteTextTrack(track);

  equal(player.remoteTextTrackEls().length, 1, 'html track element exist');

  player.removeRemoteTextTrack(htmlTrackElement);

  equal(player.remoteTextTrackEls().length, 0, 'the track element was removed correctly');

  htmlTrackElement = player.addRemoteTextTrack(track);
  equal(player.remoteTextTrackEls().length, 1, 'html track element exist');

  player.removeRemoteTextTrack(htmlTrackElement.track);
  equal(player.remoteTextTrackEls().length, 0, 'the track element was removed correctly');
});
