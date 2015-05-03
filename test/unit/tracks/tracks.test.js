import ChaptersButton from '../../../src/js/control-bar/text-track-controls/chapters-button.js';
import SubtitlesButton from '../../../src/js/control-bar/text-track-controls/subtitles-button.js';
import CaptionsButton from '../../../src/js/control-bar/text-track-controls/captions-button.js';

import TextTrackDisplay from '../../../src/js/tracks/text-track-display.js';
import Html5 from '../../../src/js/tech/html5.js';
import Flash from '../../../src/js/tech/flash.js';
import Tech from '../../../src/js/tech/tech.js';
import Component from '../../../src/js/component.js';

import * as browser from '../../../src/js/utils/browser.js';
import TestHelpers from '../test-helpers.js';
import document from 'global/document';

q.module('Tracks');

test('should place title list item into ul', function() {
  var player, chaptersButton;

  player = TestHelpers.makePlayer();

  chaptersButton = new ChaptersButton(player);

  var menuContentElement = chaptersButton.el().getElementsByTagName('UL')[0];
  var titleElement = menuContentElement.children[0];

  ok(titleElement.innerHTML === 'Chapters', 'title element placed in ul');

  player.dispose();
});

test('Player track methods call the tech', function() {
  var player,
      calls = 0;

  player = TestHelpers.makePlayer();

  player.tech.textTracks = function() {
    calls++;
  };
  player.tech.addTextTrack = function() {
    calls++;
  };

  player.addTextTrack();
  player.textTracks();

  equal(calls, 2, 'both textTrack and addTextTrack defer to the tech');
});

test('TextTrackDisplay initializes tracks on player ready', function() {
  var calls = 0,
      ttd = new TextTrackDisplay({
        on: Function.prototype,
        addTextTracks: function() {
          calls--;
        },
        getChild: function() {
          calls--;
        },
        ready: function() {
          calls++;
        }
      }, {});

  equal(calls, 1, 'only a player.ready call was made');
});

test('listen to remove and add track events in native text tracks', function() {
  var oldTestVid = Html5.TEST_VID,
      player,
      options,
      oldTextTracks,
      events = {},
      html;

  oldTextTracks = Html5.prototype.textTracks;
  Html5.prototype.textTracks = function() {
    return {
      addEventListener: function(type, handler) {
        events[type] = true;
      }
    };
  };

  Html5.TEST_VID = {
    textTracks: []
  };

  player = {
    // Function.prototype is a built-in no-op function.
    controls: Function.prototype,
    ready: Function.prototype,
    options: function() {
      return {};
    },
    addChild: Function.prototype,
    id: Function.prototype,
    el: function() {
      return {
        insertBefore: Function.prototype,
        appendChild: Function.prototype
      };
    }
  };
  player.player_ = player;
  player.options_ = options = {};

  html = new Html5(options);

  ok(events['removetrack'], 'removetrack listener was added');
  ok(events['addtrack'], 'addtrack listener was added');

  Html5.TEST_VID = oldTestVid;
  Html5.prototype.textTracks = oldTextTracks;
});

test('update texttrack buttons on removetrack or addtrack', function() {
  var update = 0,
      i,
      player,
      tag,
      track,
      oldTextTracks,
      events = {},
      oldCaptionsUpdate,
      oldSubsUpdate,
      oldChaptersUpdate;

  oldCaptionsUpdate = CaptionsButton.prototype.update;
  oldSubsUpdate = SubtitlesButton.prototype.update;
  oldChaptersUpdate = ChaptersButton.prototype.update;
  CaptionsButton.prototype.update = function() {
    update++;
    oldCaptionsUpdate.call(this);
  };
  SubtitlesButton.prototype.update = function() {
    update++;
    oldSubsUpdate.call(this);
  };
  ChaptersButton.prototype.update = function() {
    update++;
    oldChaptersUpdate.call(this);
  };

  Tech.prototype['featuresNativeTextTracks'] = true;
  oldTextTracks = Tech.prototype.textTracks;
  Tech.prototype.textTracks = function() {
    return {
      length: 0,
      addEventListener: function(type, handler) {
        if (!events[type]) {
          events[type] = [];
        }
        events[type].push(handler);
      }
    };
  };

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

  player =  TestHelpers.makePlayer({}, tag);

  player.player_ = player;

  equal(update, 3, 'update was called on the three buttons during init');

  for (i = 0; i < events['removetrack'].length; i++) {
    events['removetrack'][i]();
  }

  equal(update, 6, 'update was called on the three buttons for remove track');

  for (i = 0; i < events['addtrack'].length; i++) {
    events['addtrack'][i]();
  }

  equal(update, 9, 'update was called on the three buttons for remove track');

  Tech.prototype.textTracks = oldTextTracks;
  Tech.prototype['featuresNativeTextTracks'] = false;
  CaptionsButton.prototype.update = oldCaptionsUpdate;
  SubtitlesButton.prototype.update = oldSubsUpdate;
  ChaptersButton.prototype.update = oldChaptersUpdate;
});

test('if native text tracks are not supported, create a texttrackdisplay', function() {
  var oldTestVid = Html5.TEST_VID,
      oldIsFirefox = browser.IS_FIREFOX,
      oldTextTrackDisplay = Component.getComponent('TextTrackDisplay'),
      called = false,
      player,
      tag,
      track,
      options,
      html;

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
});

test('Player track methods call the tech', function() {
  var player,
      calls = 0;

  player = TestHelpers.makePlayer();

  player.tech.textTracks = function() {
    calls++;
  };
  player.tech.addTextTrack = function() {
    calls++;
  };

  player.addTextTrack();
  player.textTracks();

  equal(calls, 2, 'both textTrack and addTextTrack defer to the tech');
});

test('html5 tech supports native text tracks if the video supports it, unless mode is a number', function() {
  var oldTestVid = Html5.TEST_VID;

  Html5.TEST_VID = {
    textTracks: [{
      mode: 0
    }]
  };

  ok(!Html5.supportsNativeTextTracks(), 'native text tracks are not supported if mode is a number');

  Html5.TEST_VID = oldTestVid;
});

test('html5 tech supports native text tracks if the video supports it, unless it is firefox', function() {
  var oldTestVid = Html5.TEST_VID,
      oldIsFirefox = browser.IS_FIREFOX;

  Html5.TEST_VID = {
    textTracks: []
  };

  browser.IS_FIREFOX = true;

  ok(!Html5.supportsNativeTextTracks(), 'if textTracks are available on video element, native text tracks are supported');

  Html5.TEST_VID = oldTestVid;
  browser.IS_FIREFOX = oldIsFirefox;
});

test('when switching techs, we should not get a new text track', function() {
  var player = TestHelpers.makePlayer({
        html5: {
          nativeTextTracks: false
        }
      }),
      htmltracks,
      flashtracks;

  player.loadTech('Html5');

  htmltracks = player.textTracks();

  player.loadTech('Flash');

  flashtracks = player.textTracks();

  ok(htmltracks === flashtracks, 'the tracks are equal');
});
