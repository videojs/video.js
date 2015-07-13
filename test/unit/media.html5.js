var player, tech, el;

module('HTML5', {
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
    tech = new vjs.Html5(player, {});
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
  testVid = vjs.TEST_VID;
  ConstVolumeVideo = function(){
    this.volume = 1;
    this.__defineSetter__('volume', function(){});
  };
  vjs.TEST_VID = new ConstVolumeVideo();

  ok(!vjs.Html5.canControlVolume());
  vjs.TEST_VID = testVid;
});

test('should re-link the player if the tech is moved', function(){
  vjs.Html5.movingMediaElementInDOM = false;
  tech.createEl();

  strictEqual(player, tech.el()['player']);
});

test('test playbackRate', function() {
  var playbackRate;

  // Android 2.3 always returns 0 for playback rate
  if (!vjs.Html5.canControlPlaybackRate()) {
    ok('Playback rate is not supported');
    return;
  }

  tech.createEl();

  tech.el().playbackRate = 1.25;
  strictEqual(tech.playbackRate(), 1.25);

  tech['setPlaybackRate'](0.75);
  strictEqual(tech.playbackRate(), 0.75);
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
  if (!vjs.IS_IPHONE) {
    ok(!el.controls, 'controls attribute is absent');
  }

  ok(player.tagAttributes.controls, 'tag attribute is still present');
});

test('patchCanPlayType patches canplaytype with our function, conditionally', function() {
  // the patch runs automatically so we need to first unpatch
  vjs.Html5.unpatchCanPlayType();

  var oldAV = vjs.ANDROID_VERSION,
      video = document.createElement('video'),
      canPlayType = vjs.TEST_VID.constructor.prototype.canPlayType,
      patchedCanPlayType,
      unpatchedCanPlayType;

  vjs.ANDROID_VERSION = 4.0;
  vjs.Html5.patchCanPlayType();

  notStrictEqual(video.canPlayType, canPlayType, 'original canPlayType and patched canPlayType should not be equal');

  patchedCanPlayType = video.canPlayType;
  unpatchedCanPlayType = vjs.Html5.unpatchCanPlayType();

  strictEqual(canPlayType, vjs.TEST_VID.constructor.prototype.canPlayType, 'original canPlayType and unpatched canPlayType should be equal');
  strictEqual(patchedCanPlayType, unpatchedCanPlayType, 'patched canPlayType and function returned from unpatch are equal');

  vjs.ANDROID_VERSION = oldAV;
  vjs.Html5.unpatchCanPlayType();
});

test('should return maybe for HLS urls on Android 4.0 or above', function() {
  var oldAV = vjs.ANDROID_VERSION,
      video = document.createElement('video');

  vjs.ANDROID_VERSION = 4.0;
  vjs.Html5.patchCanPlayType();

  strictEqual(video.canPlayType('application/x-mpegurl'), 'maybe', 'android version 4.0 or above should be a maybe for x-mpegurl');
  strictEqual(video.canPlayType('application/x-mpegURL'), 'maybe', 'android version 4.0 or above should be a maybe for x-mpegURL');
  strictEqual(video.canPlayType('application/vnd.apple.mpegurl'), 'maybe', 'android version 4.0 or above should be a maybe for vnd.apple.mpegurl');
  strictEqual(video.canPlayType('application/vnd.apple.mpegURL'), 'maybe', 'android version 4.0 or above should be a maybe for vnd.apple.mpegurl');

  vjs.ANDROID_VERSION = oldAV;
  vjs.Html5.unpatchCanPlayType();
});

test('should return a maybe for mp4 on OLD ANDROID', function() {
  var isOldAndroid = vjs.IS_OLD_ANDROID,
      video = document.createElement('video');

  vjs.IS_OLD_ANDROID = true;
  vjs.Html5.patchCanPlayType();

  strictEqual(video.canPlayType('video/mp4'), 'maybe', 'old android should return a maybe for video/mp4');

  vjs.IS_OLD_ANDROID = isOldAndroid;
  vjs.Html5.unpatchCanPlayType();
});

test('error events may not set the errors property', function() {
  equal(tech.error(), undefined, 'no tech-level error');
  tech.trigger('error');
  ok(true, 'no error was thrown');
});

test('should have the source handler interface', function() {
  ok(vjs.Html5['registerSourceHandler'], 'has the registerSourceHandler function');
});

test('should not autoplay if there is no source', function() {
  var
    plays = 0,
    i = 0,
    readyQueue = [];

  player.play = function() {
    plays ++;
  };

  player.ready = function(func) {
    readyQueue.push(func);
  };

  player.src = function() { return ''; };

  //re-initialized the tech to catch the callback in the readyQueue
  tech = new vjs.Html5(player, {});

  //set up other options to bypass the condition
  player.options_['autoplay'] = true;
  player.paused = function () {
    return true;
  };
  player.tag = 'tag';

  for (; i < readyQueue.length; i++) {
    readyQueue[i].call(player);
  }

  equal(plays, 0, 'did not autoplay');
});

test('native source handler canHandleSource', function(){
  var result;

  // Stub the test video canPlayType (used in canHandleSource) to control results
  var origCPT = vjs.TEST_VID.canPlayType;
  vjs.TEST_VID.canPlayType = function(type){
    if (type === 'video/mp4') {
      return 'maybe';
    }
    return '';
  };

  var canHandleSource = vjs.Html5['nativeSourceHandler']['canHandleSource'];

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
  vjs.TEST_VID.canPlayType = origCPT;
});

test('handling of blob URIs with a source handler', function(){
  var origEl = tech.el_;

  // Override element
  tech.el_ = {};

  tech.setSource({ type: 'video/mp4', src: 'video.flv' });
  equal(tech.src(), 'video.flv', 'el_.src is properly set');

  tech.el_.src = 'http://url';
  equal(tech.src(), 'http://url', 'el_.src is returned if not a blob uri');

  tech.el_.src = 'blob:http://blob-url';
  equal(tech.src(), 'video.flv', 'original src set via setSource is returned if el_.src is a blob uri');

  tech.el_ = origEl;
});
