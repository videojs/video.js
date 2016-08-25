/* eslint-env qunit */
import Html5 from '../../../src/js/tech/html5.js';
import TestHelpers from '../test-helpers.js';
import sinon from 'sinon';

QUnit.module('Video Tracks', {
  beforeEach(assert) {
    this.clock = sinon.useFakeTimers();
  },
  afterEach(assert) {
    this.clock.restore();
  }
});

QUnit.test('Player track methods call the tech', function(assert) {
  let calls = 0;
  const player = TestHelpers.makePlayer();

  player.tech_.videoTracks = function() {
    calls++;
  };

  player.videoTracks();

  assert.equal(calls, 1, 'videoTrack defers to the tech');
  player.dispose();
});

QUnit.test('listen to remove and add track events in native video tracks', function(assert) {
  const oldTestVid = Html5.TEST_VID;
  const oldVideoTracks = Html5.prototype.videoTracks;
  const events = {};

  Html5.prototype.videoTracks = function() {
    return {
      addEventListener(type, handler) {
        events[type] = true;
      }
    };
  };

  Html5.TEST_VID = {
    videoTracks: []
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

  assert.ok(events.removetrack, 'removetrack listener was added');
  assert.ok(events.addtrack, 'addtrack listener was added');

  Html5.TEST_VID = oldTestVid;
  Html5.prototype.videoTracks = oldVideoTracks;
});

QUnit.test('html5 tech supports native video tracks if the video supports it', function(assert) {
  const oldTestVid = Html5.TEST_VID;

  Html5.TEST_VID = {
    videoTracks: []
  };

  assert.ok(Html5.supportsNativeVideoTracks(), 'native video tracks are supported');

  Html5.TEST_VID = oldTestVid;
});

QUnit.test('html5 tech does not support native video tracks if the video does not supports it', function(assert) {
  const oldTestVid = Html5.TEST_VID;

  Html5.TEST_VID = {};

  assert.ok(!Html5.supportsNativeVideoTracks(), 'native video tracks are not supported');

  Html5.TEST_VID = oldTestVid;
});

QUnit.test('when switching techs, we should not get a new video track', function(assert) {
  const player = TestHelpers.makePlayer();

  player.loadTech_('TechFaker');
  const firstTracks = player.videoTracks();

  player.loadTech_('TechFaker');
  const secondTracks = player.videoTracks();

  assert.ok(firstTracks === secondTracks, 'the tracks are equal');

  player.dispose();
});
