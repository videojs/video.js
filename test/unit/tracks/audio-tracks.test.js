import AudioTrack from '../../../src/js/tracks/text-track.js';
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

test('Player track methods call the tech', function() {
  let player;
  let calls = 0;

  player = TestHelpers.makePlayer();

  player.tech_.audioTracks = function() {
    calls++;
  };

  player.audioTracks();

  equal(calls, 1, 'audioTrack defers to the tech');
  player.dispose();
});

test('listen to remove and add track events in native audio tracks', function() {
  let oldTestVid = Html5.TEST_VID;
  let player;
  let options;
  let oldAudioTracks = Html5.prototype.audioTracks;
  let events = {};
  let html;

  Html5.prototype.audioTracks = function() {
    return {
      addEventListener(type, handler) {
        events[type] = true;
      }
    };
  };

  Html5.TEST_VID = {
    audioTracks: []
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
  Html5.prototype.audioTracks = oldAudioTracks;
});

test('html5 tech supports native audio tracks if the video supports it', function() {
  let oldTestVid = Html5.TEST_VID;

  Html5.TEST_VID = {
    audioTracks: []
  };

  ok(Html5.supportsNativeAudioTracks(), 'native audio tracks are supported');

  Html5.TEST_VID = oldTestVid;
});

test('html5 tech does not support native audio tracks if the video does not supports it', function() {
  let oldTestVid = Html5.TEST_VID;
  Html5.TEST_VID = {};

  ok(!Html5.supportsNativeAudioTracks(), 'native audio tracks are not supported');

  Html5.TEST_VID = oldTestVid;
});

test('when switching techs, we should not get a new audio track', function() {
  let player = TestHelpers.makePlayer();

  player.loadTech_('TechFaker');
  let firstTracks = player.audioTracks();

  player.loadTech_('TechFaker');
  let secondTracks = player.audioTracks();

  ok(firstTracks === secondTracks, 'the tracks are equal');
});
