import Flash from '../../../src/js/tech/flash.js';
import { createTimeRange } from '../../../src/js/utils/time-ranges.js';
import document from 'global/document';

q.module('Flash');

test('Flash.canPlaySource', function() {
  var canPlaySource = Flash.canPlaySource;

  // Supported
  ok(canPlaySource({ type: 'video/mp4; codecs=avc1.42E01E,mp4a.40.2' }), 'codecs supported');
  ok(canPlaySource({ type: 'video/mp4' }), 'video/mp4 supported');
  ok(canPlaySource({ type: 'video/x-flv' }), 'video/x-flv supported');
  ok(canPlaySource({ type: 'video/flv' }), 'video/flv supported');
  ok(canPlaySource({ type: 'video/m4v' }), 'video/m4v supported');
  ok(canPlaySource({ type: 'VIDEO/FLV' }), 'capitalized mime type');

  // Not supported
  ok(!canPlaySource({ type: 'video/webm; codecs="vp8, vorbis"' }));
  ok(!canPlaySource({ type: 'video/webm' }));
});

test('currentTime', function() {
  let getCurrentTime = Flash.prototype.currentTime;
  let setCurrentTime = Flash.prototype.setCurrentTime;
  let seekingCount = 0;
  let seeking = false;
  let setPropVal;
  let getPropVal;
  let result;

  // Mock out a Flash instance to avoid creating the swf object
  let mockFlash = {
    el_: {
      vjs_setProperty(prop, val){
        setPropVal = val;
      },
      vjs_getProperty(){
        return getPropVal;
      }
    },
    seekable(){
      return createTimeRange(5, 1000);
    },
    trigger(event){
      if (event === 'seeking') {
        seekingCount++;
      }
    },
    seeking(){
      return seeking;
    }
  };

  // Test the currentTime getter
  getPropVal = 3;
  result = getCurrentTime.call(mockFlash);
  equal(result, 3, 'currentTime is retreived from the swf element');

  // Test the currentTime setter
  setCurrentTime.call(mockFlash, 10);
  equal(setPropVal, 10, 'currentTime is set on the swf element');
  equal(seekingCount, 1, 'triggered seeking');

  // Test current time while seeking
  setCurrentTime.call(mockFlash, 20);
  seeking = true;
  result = getCurrentTime.call(mockFlash);
  equal(result, 20, 'currentTime is retrieved from the lastSeekTarget while seeking');
  notEqual(result, getPropVal, 'currentTime is not retrieved from the element while seeking');
  equal(seekingCount, 2, 'triggered seeking');

  // clamp seeks to seekable
  setCurrentTime.call(mockFlash, 1001);
  result = getCurrentTime.call(mockFlash);
  equal(result, mockFlash.seekable().end(0), 'clamped to the seekable end');
  equal(seekingCount, 3, 'triggered seeking');

  setCurrentTime.call(mockFlash, 1);
  result = getCurrentTime.call(mockFlash);
  equal(result, mockFlash.seekable().start(0), 'clamped to the seekable start');
  equal(seekingCount, 4, 'triggered seeking');
});

test('dispose removes the object element even before ready fires', function() {
  // This test appears to test bad functionaly that was fixed
  // so it's debateable whether or not it's useful
  let dispose = Flash.prototype.dispose;
  let mockFlash = {};
  let noop = function(){};

  // Mock required functions for dispose
  mockFlash.off = noop;
  mockFlash.trigger = noop;
  mockFlash.el_ = {};

  dispose.call(mockFlash);
  strictEqual(mockFlash.el_, null, 'swf el is nulled');
});

test('ready triggering before and after disposing the tech', function() {
  let checkReady = sinon.stub(Flash, 'checkReady');
  let fixtureDiv = document.getElementById('qunit-fixture');
  let playerDiv = document.createElement('div');
  let techEl = document.createElement('div');

  techEl.id = 'foo1234';
  playerDiv.appendChild(techEl);
  fixtureDiv.appendChild(playerDiv);

  // Mock the swf element
  techEl.tech = {
    el: function() {
      return techEl;
    }
  };

  playerDiv.player = {
    tech: techEl.tech
  };

  Flash.onReady(techEl.id);
  ok(checkReady.called, 'checkReady should be called before the tech is disposed');

  // remove the tech el from the player div to simulate being disposed
  playerDiv.removeChild(techEl);
  Flash.onReady(techEl.id);
  ok(!checkReady.calledTwice, 'checkReady should not be called after the tech is disposed');

  Flash.checkReady.restore();
});

test('should have the source handler interface', function() {
  ok(Flash.registerSourceHandler, 'has the registerSourceHandler function');
});

test('canHandleSource should be able to work with src objects without a type', function () {
  let canHandleSource = Flash.nativeSourceHandler.canHandleSource;

  equal('maybe', canHandleSource({ src: 'test.video.mp4' }), 'should guess that it is a mp4 video');
  equal('maybe', canHandleSource({ src: 'test.video.m4v' }), 'should guess that it is a m4v video');
  equal('maybe', canHandleSource({ src: 'test.video.flv' }), 'should guess that it is a flash video');
  equal('', canHandleSource({ src: 'test.video.wgg' }), 'should return empty string if it can not play the video');
});

test('seekable', function() {
  let seekable = Flash.prototype.seekable;
  let result;
  let mockFlash = {
    duration: function() {
      return this.duration_;
    }
  };

  // Test a normal duration
  mockFlash.duration_ = 23;
  result = seekable.call(mockFlash);
  equal(result.length, 1, 'seekable is non-empty');
  equal(result.start(0), 0, 'starts at zero');
  equal(result.end(0), mockFlash.duration_, 'ends at the duration');

  // Test a zero duration
  mockFlash.duration_ = 0;
  result = seekable.call(mockFlash);
  equal(result.length, mockFlash.duration_, 'seekable is empty with a zero duration');
});

// fake out the <object> interaction but leave all the other logic intact
class MockFlash extends Flash {
  constructor() {
    super({});
  }
}
