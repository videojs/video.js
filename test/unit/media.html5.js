var player, tech, el;

module('HTML5', {
  'setup': function() {

    el = document.createElement('div');
    el.innerHTML = '<div />';

    player = {
      id: function(){ return 'id'; },
      el: function(){ return el; },
      options_: {},
      options: function(){ return {}; },
      controls: function(){ return false; },
      usingNativeControls: function(){ return false; },
      on: function(){ return this; },
      off: function() { return this; },
      ready: function(){}
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

  tech.createEl();

  tech.el().playbackRate = 1.25;
  strictEqual(tech.playbackRate(), 1.25);

  tech['setPlaybackRate'](0.75);
  strictEqual(tech.playbackRate(), 0.75);
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
