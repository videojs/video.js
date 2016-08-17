/* eslint-env qunit */
import Flash from '../../../src/js/tech/flash.js';
import { createTimeRange } from '../../../src/js/utils/time-ranges.js';
import document from 'global/document';
import sinon from 'sinon';

// fake out the <object> interaction but leave all the other logic intact
class MockFlash extends Flash {
  constructor() {
    super({});
  }
}

QUnit.module('Flash');

QUnit.test('Flash.canPlaySource', function(assert) {
  const canPlaySource = Flash.canPlaySource;

  // Supported
  assert.ok(canPlaySource({type: 'video/mp4; codecs=avc1.42E01E,mp4a.40.2' }, {}),
           'codecs supported');
  assert.ok(canPlaySource({type: 'video/mp4' }, {}), 'video/mp4 supported');
  assert.ok(canPlaySource({type: 'video/x-flv' }, {}), 'video/x-flv supported');
  assert.ok(canPlaySource({type: 'video/flv' }, {}), 'video/flv supported');
  assert.ok(canPlaySource({type: 'video/m4v' }, {}), 'video/m4v supported');
  assert.ok(canPlaySource({type: 'VIDEO/FLV' }, {}), 'capitalized mime type');

  // Not supported
  assert.ok(!canPlaySource({ type: 'video/webm; codecs="vp8, vorbis"' }, {}));
  assert.ok(!canPlaySource({ type: 'video/webm' }, {}));
});

QUnit.test('currentTime', function(assert) {
  const getCurrentTime = Flash.prototype.currentTime;
  const setCurrentTime = Flash.prototype.setCurrentTime;
  let seekingCount = 0;
  let seeking = false;
  let setPropVal;
  let getPropVal;
  let result;

  // Mock out a Flash instance to avoid creating the swf object
  const mockFlash = {
    el_: {
      /* eslint-disable camelcase */
      vjs_setProperty(prop, val) {
        setPropVal = val;
      },
      vjs_getProperty() {
        return getPropVal;
      }
      /* eslint-enable camelcase */
    },
    seekable() {
      return createTimeRange(5, 1000);
    },
    trigger(event) {
      if (event === 'seeking') {
        seekingCount++;
      }
    },
    seeking() {
      return seeking;
    }
  };

  // Test the currentTime getter
  getPropVal = 3;
  result = getCurrentTime.call(mockFlash);
  assert.equal(result, 3, 'currentTime is retreived from the swf element');

  // Test the currentTime setter
  setCurrentTime.call(mockFlash, 10);
  assert.equal(setPropVal, 10, 'currentTime is set on the swf element');
  assert.equal(seekingCount, 1, 'triggered seeking');

  // Test current time while seeking
  setCurrentTime.call(mockFlash, 20);
  seeking = true;
  result = getCurrentTime.call(mockFlash);
  assert.equal(result,
              20,
              'currentTime is retrieved from the lastSeekTarget while seeking');
  assert.notEqual(result,
                 getPropVal,
                 'currentTime is not retrieved from the element while seeking');
  assert.equal(seekingCount, 2, 'triggered seeking');

  // clamp seeks to seekable
  setCurrentTime.call(mockFlash, 1001);
  result = getCurrentTime.call(mockFlash);
  assert.equal(result, mockFlash.seekable().end(0), 'clamped to the seekable end');
  assert.equal(seekingCount, 3, 'triggered seeking');

  setCurrentTime.call(mockFlash, 1);
  result = getCurrentTime.call(mockFlash);
  assert.equal(result, mockFlash.seekable().start(0), 'clamped to the seekable start');
  assert.equal(seekingCount, 4, 'triggered seeking');
});

QUnit.test('dispose removes the object element even before ready fires', function(assert) {
  // This test appears to test bad functionaly that was fixed
  // so it's debateable whether or not it's useful
  const dispose = Flash.prototype.dispose;
  const mockFlash = new MockFlash();
  const noop = function() {};

  // Mock required functions for dispose
  mockFlash.off = noop;
  mockFlash.trigger = noop;
  mockFlash.el_ = {};

  dispose.call(mockFlash);
  assert.strictEqual(mockFlash.el_, null, 'swf el is nulled');
});

QUnit.test('ready triggering before and after disposing the tech', function(assert) {
  const checkReady = sinon.stub(Flash, 'checkReady');
  const fixtureDiv = document.getElementById('qunit-fixture');
  const playerDiv = document.createElement('div');
  const techEl = document.createElement('div');

  techEl.id = 'foo1234';
  playerDiv.appendChild(techEl);
  fixtureDiv.appendChild(playerDiv);

  // Mock the swf element
  techEl.tech = {
    el() {
      return techEl;
    }
  };

  playerDiv.player = {
    tech: techEl.tech
  };

  Flash.onReady(techEl.id);
  assert.ok(checkReady.called, 'checkReady should be called before the tech is disposed');

  // remove the tech el from the player div to simulate being disposed
  playerDiv.removeChild(techEl);
  Flash.onReady(techEl.id);
  assert.ok(!checkReady.calledTwice,
           'checkReady should not be called after the tech is disposed');

  Flash.checkReady.restore();
});

QUnit.test('should have the source handler interface', function(assert) {
  assert.ok(Flash.registerSourceHandler, 'has the registerSourceHandler function');
});

QUnit.test('canPlayType should select the correct types to play', function(assert) {
  const canPlayType = Flash.nativeSourceHandler.canPlayType;

  assert.equal(canPlayType('video/flv'), 'maybe', 'should be able to play FLV files');
  assert.equal(canPlayType('video/x-flv'), 'maybe', 'should be able to play x-FLV files');
  assert.equal(canPlayType('video/mp4'), 'maybe', 'should be able to play MP4 files');
  assert.equal(canPlayType('video/m4v'), 'maybe', 'should be able to play M4V files');
  assert.equal(canPlayType('video/ogg'),
              '',
              'should return empty string if it can not play the video');
});

QUnit.test('canHandleSource should be able to work with src objects without a type', function(assert) {
  const canHandleSource = Flash.nativeSourceHandler.canHandleSource;

  assert.equal('maybe',
              canHandleSource({ src: 'test.video.mp4' }, {}),
              'should guess that it is a mp4 video');
  assert.equal('maybe',
              canHandleSource({ src: 'test.video.m4v' }, {}),
              'should guess that it is a m4v video');
  assert.equal('maybe',
              canHandleSource({ src: 'test.video.flv' }, {}),
              'should guess that it is a flash video');
  assert.equal('',
              canHandleSource({ src: 'test.video.wgg' }, {}),
              'should return empty string if it can not play the video');
});

QUnit.test('seekable', function(assert) {
  const seekable = Flash.prototype.seekable;
  let result;
  const mockFlash = {
    duration() {
      return this.duration_;
    }
  };

  // Test a normal duration
  mockFlash.duration_ = 23;
  result = seekable.call(mockFlash);
  assert.equal(result.length, 1, 'seekable is non-empty');
  assert.equal(result.start(0), 0, 'starts at zero');
  assert.equal(result.end(0), mockFlash.duration_, 'ends at the duration');

  // Test a zero duration
  mockFlash.duration_ = 0;
  result = seekable.call(mockFlash);
  assert.equal(result.length, mockFlash.duration_,
              'seekable is empty with a zero duration');
});

QUnit.test('play after ended seeks to the beginning', function(assert) {
  let plays = 0;
  const seeks = [];

  Flash.prototype.play.call({
    el_: {
      /* eslint-disable camelcase */
      vjs_play() {
        plays++;
      }
      /* eslint-enable camelcase */
    },
    ended() {
      return true;
    },
    setCurrentTime(time) {
      seeks.push(time);
    }
  });

  assert.equal(plays, 1, 'called play on the SWF');
  assert.equal(seeks.length, 1, 'seeked on play');
  assert.equal(seeks[0], 0, 'seeked to the beginning');
});

QUnit.test('duration returns NaN, Infinity or duration according to the HTML standard', function(assert) {
  const duration = Flash.prototype.duration;
  let mockedDuration = -1;
  let mockedReadyState = 0;
  let result;
  const mockFlash = {
    el_: {
      /* eslint-disable camelcase */
      vjs_getProperty() {
        return mockedDuration;
      }
      /* eslint-enable camelcase */
    },
    readyState() {
      return mockedReadyState;
    }
  };

  result = duration.call(mockFlash);
  assert.ok(Number.isNaN(result), 'duration returns NaN when readyState equals 0');

  mockedReadyState = 1;
  result = duration.call(mockFlash);
  assert.ok(!Number.isFinite(result),
           'duration returns Infinity when duration property is less then 0');

  mockedDuration = 1;
  result = duration.call(mockFlash);
  assert.equal(result,
              1,
              'duration returns duration property when readyState' +
              ' and duration property are both higher than 0');
});
