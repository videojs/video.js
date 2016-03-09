var player, tech, el;

import Html5 from '../../../src/js/tech/html5.js';
import * as browser from '../../../src/js/utils/browser.js';
import document from 'global/document';

q.module('HTML5', {
  'setup': function() {

    el = document.createElement('div');
    el.innerHTML = '<div />';

    player = {
      id: function(){ return 'id'; },
      el: function(){ return el; },
      options_: {},
      options: function(){ return this.options_; },
      bufferedPercent: function() { return 0; },
      controls: function(){ return false; },
      usingNativeControls: function(){ return false; },
      on: function(){ return this; },
      off: function() { return this; },
      ready: function(){},
      addChild: function(){},
      trigger: function(){}
    };
    tech = new Html5({});
  },
  'teardown': function() {
    tech.dispose();
    el = null;
    player = null;
    tech = null;
  }
});

test('should detect whether the volume can be changed', function(){
  var testVid, ConstVolumeVideo;
  if (!{}['__defineSetter__']) {
    ok(true, 'your browser does not support this test, skipping it');
    return;
  }
  testVid = Html5.TEST_VID;
  ConstVolumeVideo = function(){
    this.volume = 1;
    this.__defineSetter__('volume', function(){});
  };
  Html5.TEST_VID = new ConstVolumeVideo();

  ok(!Html5.canControlVolume());
  Html5.TEST_VID = testVid;
});

test('test playbackRate', function() {
  var playbackRate;

  // Android 2.3 always returns 0 for playback rate
  if (!Html5.canControlPlaybackRate()) {
    ok('Playback rate is not supported');
    return;
  }

  tech.createEl();

  tech.el().playbackRate = 1.25;
  strictEqual(tech.playbackRate(), 1.25);

  tech['setPlaybackRate'](0.75);
  strictEqual(tech.playbackRate(), 0.75);
});

test('should export played', function() {
  tech.createEl();
  deepEqual(tech.played(), tech.el().played, 'returns the played attribute');
});

test('should remove the controls attribute when recreating the element', function() {
  var el;
  player.tagAttributes = {
    controls: true
  };
  // force custom controls so the test environment is equivalent on iOS
  player.options_['nativeControlsForTouch'] = false;
  el = tech.createEl();

  // On the iPhone controls are always true
  if (!browser.IS_IPHONE) {
    ok(!el.controls, 'controls attribute is absent');
  }

  ok(player.tagAttributes.controls, 'tag attribute is still present');
});

test('patchCanPlayType patches canplaytype with our function, conditionally', function() {
  // the patch runs automatically so we need to first unpatch
  Html5.unpatchCanPlayType();

  var oldAV = browser.ANDROID_VERSION,
      video = document.createElement('video'),
      canPlayType = Html5.TEST_VID.constructor.prototype.canPlayType,
      patchedCanPlayType,
      unpatchedCanPlayType;

  browser.ANDROID_VERSION = 4.0;
  Html5.patchCanPlayType();

  notStrictEqual(video.canPlayType, canPlayType, 'original canPlayType and patched canPlayType should not be equal');

  patchedCanPlayType = video.canPlayType;
  unpatchedCanPlayType = Html5.unpatchCanPlayType();

  strictEqual(canPlayType, Html5.TEST_VID.constructor.prototype.canPlayType, 'original canPlayType and unpatched canPlayType should be equal');
  strictEqual(patchedCanPlayType, unpatchedCanPlayType, 'patched canPlayType and function returned from unpatch are equal');

  browser.ANDROID_VERSION = oldAV;
  Html5.unpatchCanPlayType();
});

test('should return maybe for HLS urls on Android 4.0 or above', function() {
  var oldAV = browser.ANDROID_VERSION,
      video = document.createElement('video');

  browser.ANDROID_VERSION = 4.0;
  Html5.patchCanPlayType();

  strictEqual(video.canPlayType('application/x-mpegurl'), 'maybe', 'android version 4.0 or above should be a maybe for x-mpegurl');
  strictEqual(video.canPlayType('application/x-mpegURL'), 'maybe', 'android version 4.0 or above should be a maybe for x-mpegURL');
  strictEqual(video.canPlayType('application/vnd.apple.mpegurl'), 'maybe', 'android version 4.0 or above should be a maybe for vnd.apple.mpegurl');
  strictEqual(video.canPlayType('application/vnd.apple.mpegURL'), 'maybe', 'android version 4.0 or above should be a maybe for vnd.apple.mpegurl');

  browser.ANDROID_VERSION = oldAV;
  Html5.unpatchCanPlayType();
});

test('should return a maybe for mp4 on OLD ANDROID', function() {
  var isOldAndroid = browser.IS_OLD_ANDROID,
      video = document.createElement('video');

  browser.IS_OLD_ANDROID = true;
  Html5.patchCanPlayType();

  strictEqual(video.canPlayType('video/mp4'), 'maybe', 'old android should return a maybe for video/mp4');

  browser.IS_OLD_ANDROID = isOldAndroid;
  Html5.unpatchCanPlayType();
});

test('error events may not set the errors property', function() {
  equal(tech.error(), undefined, 'no tech-level error');
  tech.trigger('error');
  ok(true, 'no error was thrown');
});

test('should have the source handler interface', function() {
  ok(Html5.registerSourceHandler, 'has the registerSourceHandler function');
});

test('native source handler canPlayType', function(){
  var result;

  // Stub the test video canPlayType (used in canPlayType) to control results
  var origCPT = Html5.TEST_VID.canPlayType;
  Html5.TEST_VID.canPlayType = function(type){
    if (type === 'video/mp4') {
      return 'maybe';
    }
    return '';
  };

  var canPlayType = Html5.nativeSourceHandler.canPlayType;

  equal(canPlayType('video/mp4'), 'maybe', 'Native source handler reported type support');
  equal(canPlayType('foo'), '', 'Native source handler handled bad type');

  // Reset test video canPlayType
  Html5.TEST_VID.canPlayType = origCPT;
});

test('native source handler canHandleSource', function(){
  var result;

  // Stub the test video canPlayType (used in canHandleSource) to control results
  var origCPT = Html5.TEST_VID.canPlayType;
  Html5.TEST_VID.canPlayType = function(type){
    if (type === 'video/mp4') {
      return 'maybe';
    }
    return '';
  };

  var canHandleSource = Html5.nativeSourceHandler.canHandleSource;

  equal(canHandleSource({ type: 'video/mp4', src: 'video.flv' }), 'maybe', 'Native source handler reported type support');
  equal(canHandleSource({ src: 'http://www.example.com/video.mp4' }), 'maybe', 'Native source handler reported extension support');
  equal(canHandleSource({ src: 'https://example.com/video.sd.mp4?s=foo&token=bar' }), 'maybe', 'Native source handler reported extension support');
  equal(canHandleSource({ src: 'https://example.com/video.sd.mp4?s=foo' }), 'maybe', 'Native source handler reported extension support');

  // Test for issue videojs/video.js#1785 and other potential failures
  equal(canHandleSource({ src: '' }), '', 'Native source handler handled empty src');
  equal(canHandleSource({}), '', 'Native source handler handled empty object');
  equal(canHandleSource({ src: 'foo' }), '', 'Native source handler handled bad src');
  equal(canHandleSource({ type: 'foo' }), '', 'Native source handler handled bad type');

  // Reset test video canPlayType
  Html5.TEST_VID.canPlayType = origCPT;
});

if (Html5.supportsNativeTextTracks()) {
  test('add native textTrack listeners on startup', function() {
    let adds = [];
    let rems = [];
    let tt = {
      length: 0,
      addEventListener: (type, fn) => adds.push([type, fn]),
      removeEventListener: (type, fn) => rems.push([type, fn]),
    };
    let el = document.createElement('div');
    el.textTracks = tt;

    let htmlTech = new Html5({el});

    equal(adds[0][0], 'change', 'change event handler added');
    equal(adds[1][0], 'addtrack', 'addtrack event handler added');
    equal(adds[2][0], 'removetrack', 'removetrack event handler added');
  });

  test('remove all tracks from emulated list on dispose', function() {
    let adds = [];
    let rems = [];
    let tt = {
      length: 0,
      addEventListener: (type, fn) => adds.push([type, fn]),
      removeEventListener: (type, fn) => rems.push([type, fn]),
    };
    let el = document.createElement('div');
    el.textTracks = tt;

    let htmlTech = new Html5({el});
    htmlTech.dispose();

    equal(adds[0][0], 'change', 'change event handler added');
    equal(adds[1][0], 'addtrack', 'addtrack event handler added');
    equal(adds[2][0], 'removetrack', 'removetrack event handler added');
    equal(rems[0][0], 'change', 'change event handler removed');
    equal(rems[1][0], 'addtrack', 'addtrack event handler removed');
    equal(rems[2][0], 'removetrack', 'removetrack event handler removed');
    equal(adds[0][0], rems[0][0], 'change event handler removed');
    equal(adds[1][0], rems[1][0], 'addtrack event handler removed');
    equal(adds[2][0], rems[2][0], 'removetrack event handler removed');
  });
}

if (Html5.supportsNativeAudioTracks()) {
  test('add native audioTrack listeners on startup', function() {
    let adds = [];
    let rems = [];
    let at = {
      length: 0,
      addEventListener: (type, fn) => adds.push([type, fn]),
      removeEventListener: (type, fn) => rems.push([type, fn]),
    };
    let el = document.createElement('div');
    el.audioTracks = at;

    let htmlTech = new Html5({el});

    equal(adds[0][0], 'change', 'change event handler added');
    equal(adds[1][0], 'addtrack', 'addtrack event handler added');
    equal(adds[2][0], 'removetrack', 'removetrack event handler added');
  });

  test('remove all tracks from emulated list on dispose', function() {
    let adds = [];
    let rems = [];
    let at = {
      length: 0,
      addEventListener: (type, fn) => adds.push([type, fn]),
      removeEventListener: (type, fn) => rems.push([type, fn]),
    };
    let el = document.createElement('div');
    el.audioTracks = at;

    let htmlTech = new Html5({el});
    htmlTech.dispose();

    equal(adds[0][0], 'change', 'change event handler added');
    equal(adds[1][0], 'addtrack', 'addtrack event handler added');
    equal(adds[2][0], 'removetrack', 'removetrack event handler added');
    equal(rems[0][0], 'change', 'change event handler removed');
    equal(rems[1][0], 'addtrack', 'addtrack event handler removed');
    equal(rems[2][0], 'removetrack', 'removetrack event handler removed');
    equal(adds[0][0], rems[0][0], 'change event handler removed');
    equal(adds[1][0], rems[1][0], 'addtrack event handler removed');
    equal(adds[2][0], rems[2][0], 'removetrack event handler removed');
  });
}

if (Html5.supportsNativeVideoTracks()) {
  test('add native videoTrack listeners on startup', function() {
    let adds = [];
    let rems = [];
    let vt = {
      length: 0,
      addEventListener: (type, fn) => adds.push([type, fn]),
      removeEventListener: (type, fn) => rems.push([type, fn]),
    };
    let el = document.createElement('div');
    el.videoTracks = vt;

    let htmlTech = new Html5({el});

    equal(adds[0][0], 'change', 'change event handler added');
    equal(adds[1][0], 'addtrack', 'addtrack event handler added');
    equal(adds[2][0], 'removetrack', 'removetrack event handler added');
  });

  test('remove all tracks from emulated list on dispose', function() {
    let adds = [];
    let rems = [];
    let vt = {
      length: 0,
      addEventListener: (type, fn) => adds.push([type, fn]),
      removeEventListener: (type, fn) => rems.push([type, fn]),
    };
    let el = document.createElement('div');
    el.videoTracks = vt;

    let htmlTech = new Html5({el});
    htmlTech.dispose();

    equal(adds[0][0], 'change', 'change event handler added');
    equal(adds[1][0], 'addtrack', 'addtrack event handler added');
    equal(adds[2][0], 'removetrack', 'removetrack event handler added');
    equal(rems[0][0], 'change', 'change event handler removed');
    equal(rems[1][0], 'addtrack', 'addtrack event handler removed');
    equal(rems[2][0], 'removetrack', 'removetrack event handler removed');
    equal(adds[0][0], rems[0][0], 'change event handler removed');
    equal(adds[1][0], rems[1][0], 'addtrack event handler removed');
    equal(adds[2][0], rems[2][0], 'removetrack event handler removed');
  });
}

test('should always return currentSource_ if set', function(){
  let currentSrc = Html5.prototype.currentSrc;
  equal(currentSrc.call({el_: {currentSrc:'test1'}}), 'test1', 'sould return source from element if nothing else set');
  equal(currentSrc.call({currentSource_:{src: 'test2'}}), 'test2', 'sould return source from currentSource_, if nothing else set');
  equal(currentSrc.call({currentSource_:{src: 'test2'}, el_:{currentSrc:'test1'}}), 'test2', 'sould return source from  source set, not from element');
});

test('should fire makeup events when a video tag is initialized late', function(){
  let lateInit = Html5.prototype.handleLateInit_;
  let triggeredEvents = [];
  let mockHtml5 = {
    readyListeners: [],
    ready(listener){
      this.readyListeners.push(listener);
    },
    triggerReady(){
      this.readyListeners.forEach(function(listener){
        listener.call(this);
      }, this);
    },
    trigger(type){
      triggeredEvents.push(type);
    },
    on: function(){},
    off: function(){}
  };

  function resetMock() {
    triggeredEvents = {};
    mockHtml5.readyListeners = [];
  }

  function testStates(statesObject, expectedEvents) {
    lateInit.call(mockHtml5, statesObject);
    mockHtml5.triggerReady();
    deepEqual(triggeredEvents, expectedEvents, `wrong events triggered for networkState:${statesObject.networkState} and readyState:${statesObject.readyState || 'no readyState'}`);

    // reset mock
    triggeredEvents = [];
    mockHtml5.readyListeners = [];
  }

  // Network States
  testStates({ networkState: 0, readyState: 0 }, []);
  testStates({ networkState: 1, readyState: 0 }, ['loadstart']);
  testStates({ networkState: 2, readyState: 0 }, ['loadstart']);
  testStates({ networkState: 3, readyState: 0 }, []);

  // Ready States
  testStates({ networkState: 1, readyState: 0 }, ['loadstart']);
  testStates({ networkState: 1, readyState: 1 }, ['loadstart', 'loadedmetadata']);
  testStates({ networkState: 1, readyState: 2 }, ['loadstart', 'loadedmetadata', 'loadeddata']);
  testStates({ networkState: 1, readyState: 3 }, ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay']);
  testStates({ networkState: 1, readyState: 4 }, ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough']);
});

test('Html5.resetMediaElement should remove sources and call load', function() {
  let selector;
  let removedChildren = [];
  let removedAttribute;
  let loaded;

  let children = ['source1', 'source2', 'source3'];
  let testEl = {
    querySelectorAll(input) {
      selector = input;
      return children;
    },

    removeChild(child) {
      removedChildren.push(child);
    },

    removeAttribute(attr) {
      removedAttribute = attr;
    },

    load() {
      loaded = true;
    }
  };

  Html5.resetMediaElement(testEl);
  equal(selector, 'source', 'we got the source elements from the test el');
  deepEqual(removedChildren, children.reverse(), 'we removed the children that were present');
  equal(removedAttribute, 'src', 'we removed the src attribute');
  ok(loaded, 'we called load on the element');
});

test('Html5#reset calls Html5.resetMediaElement when called', function() {
  let oldResetMedia = Html5.resetMediaElement;
  let resetEl;

  Html5.resetMediaElement = (el) => resetEl = el;

  let el = {};
  Html5.prototype.reset.call({el_: el});

  equal(resetEl, el, 'we called resetMediaElement with the tech\'s el');

  Html5.resetMediaElement = oldResetMedia;
});
