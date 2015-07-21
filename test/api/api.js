/**
 * These tests run on the minified, window.videojs and ensure the needed
 * APIs still exist
 */

(function(){

q.module('Player API');

test('videojs should exist on the window', function() {
  ok(window.videojs, 'videojs exists on the window');
});

test('should be able to access expected player API methods', function() {
  var player = videojs.getComponent('Player').prototype;

  // Native HTML5 Methods
  ok(player.error, 'error exists');
  ok(player.src, 'src exists');
  ok(player.currentSrc, 'currentSrc exists');
  ok(player.buffered, 'buffered exists');
  ok(player.load, 'load exists');
  ok(player.seeking, 'seeking exists');
  ok(player.currentTime, 'currentTime exists');
  ok(player.duration, 'duration exists');
  ok(player.paused, 'paused exists');
  ok(player.ended, 'ended exists');
  ok(player.autoplay, 'autoplay exists');
  ok(player.loop, 'loop exists');
  ok(player.play , 'play exists');
  ok(player.pause , 'pause exists');
  ok(player.controls, 'controls exists');
  ok(player.volume, 'volume exists');
  ok(player.muted, 'muted exists');
  ok(player.width, 'width exists');
  ok(player.height, 'height exists');
  ok(player.poster, 'poster exists');
  ok(player.textTracks, 'textTracks exists');
  ok(player.requestFullscreen, 'requestFullscreen exists');
  ok(player.exitFullscreen, 'exitFullscreen exists');
  ok(player.playbackRate, 'playbackRate exists');
  ok(player.networkState, 'networkState exists');
  ok(player.readyState, 'readyState exists');

  // Unsupported Native HTML5 Methods
  // ok(player.canPlayType, 'canPlayType exists');
  // ok(player.startTime, 'startTime exists');
  // ok(player.defaultPlaybackRate, 'defaultPlaybackRate exists');
  // ok(player.playbackRate, 'playbackRate exists');
  // ok(player.played, 'played exists');
  // ok(player.seekable, 'seekable exists');
  // ok(player.videoWidth, 'videoWidth exists');
  // ok(player.videoHeight, 'videoHeight exists');

  // Additional player methods
  ok(player.bufferedPercent, 'bufferedPercent exists');
  ok(player.reportUserActivity, 'reportUserActivity exists');
  ok(player.userActive, 'userActive exists');
  ok(player.usingNativeControls, 'usingNativeControls exists');
  ok(player.isFullscreen, 'isFullscreen exists');

  // TextTrack methods
  ok(player.textTracks, 'textTracks exists');
  ok(player.remoteTextTracks, 'remoteTextTracks exists');
  ok(player.addTextTrack, 'addTextTrack exists');
  ok(player.addRemoteTextTrack, 'addRemoteTextTrack exists');
  ok(player.removeRemoteTextTrack, 'removeRemoteTextTrack exists');

  // Deprecated methods that should still exist
  ok(player.requestFullScreen, 'requestFullScreen exists');
  ok(player.isFullScreen, 'isFullScreen exists');
  ok(player.cancelFullScreen, 'cancelFullScreen exists');
});

test('should be able to access expected component API methods', function() {
  var Component = videojs.getComponent('Component');
  var comp = new Component({ id: function(){ return 1; }, reportUserActivity: function(){} });

  // Component methods
  ok(comp.player, 'player exists');
  ok(comp.options, 'options exists');
  ok(comp.init, 'init exists');
  ok(comp.dispose, 'dispose exists');
  ok(comp.createEl, 'createEl exists');
  ok(comp.contentEl, 'contentEl exists');
  ok(comp.el, 'el exists');
  ok(comp.addChild, 'addChild exists');
  ok(comp.getChild, 'getChild exists');
  ok(comp.getChildById, 'getChildById exists');
  ok(comp.children, 'children exists');
  ok(comp.initChildren, 'initChildren exists');
  ok(comp.removeChild, 'removeChild exists');
  ok(comp.on, 'on exists');
  ok(comp.off, 'off exists');
  ok(comp.one, 'one exists');
  ok(comp.trigger, 'trigger exists');
  ok(comp.triggerReady, 'triggerReady exists');
  ok(comp.show, 'show exists');
  ok(comp.hide, 'hide exists');
  ok(comp.width, 'width exists');
  ok(comp.height, 'height exists');
  ok(comp.dimensions, 'dimensions exists');
  ok(comp.ready, 'ready exists');
  ok(comp.addClass, 'addClass exists');
  ok(comp.removeClass, 'removeClass exists');
  ok(comp.buildCSSClass, 'buildCSSClass exists');
  ok(comp.setInterval, 'setInterval exists');
  ok(comp.clearInterval, 'clearInterval exists');
  ok(comp.setTimeout, 'setTimeout exists');
  ok(comp.clearTimeout, 'clearTimeout exists');
});

test('should be able to access expected MediaTech API methods', function() {
  var media = videojs.getComponent('Tech');
  var mediaProto = media.prototype;
  var html5 = videojs.getComponent('Html5');
  var html5Proto = html5.prototype;
  var flash = videojs.getComponent('Flash');
  var flashProto = flash.prototype;

  ok(mediaProto.setPoster, 'setPoster should exist on the Media tech');
  ok(html5Proto.setPoster, 'setPoster should exist on the HTML5 tech');
  ok(flashProto.setPoster, 'setPoster should exist on the Flash tech');

  ok(html5.patchCanPlayType, 'patchCanPlayType should exist for HTML5');
  ok(html5.unpatchCanPlayType, 'unpatchCanPlayType should exist for HTML5');

  // Source Handler Functions
  ok(media.withSourceHandlers, 'withSourceHandlers should exist for Media Tech');

  ok(html5.canPlaySource, 'canPlaySource should exist for HTML5');
  ok(html5.registerSourceHandler, 'registerSourceHandler should exist for Html5');
  ok(html5.selectSourceHandler, 'selectSourceHandler should exist for Html5');
  ok(html5.prototype.setSource, 'setSource should exist for Html5');
  ok(html5.prototype.disposeSourceHandler, 'disposeSourceHandler should exist for Html5');

  ok(flash.canPlaySource, 'canPlaySource should exist for Flash');
  ok(flash.registerSourceHandler, 'registerSourceHandler should exist for Flash');
  ok(flash.selectSourceHandler, 'selectSourceHandler should exist for Flash');
  ok(flash.prototype.setSource, 'setSource should exist for Flash');
  ok(flash.prototype.disposeSourceHandler, 'disposeSourceHandler should exist for Flash');
});

test('should export ready api call to public', function() {
  var videoTag = testHelperMakeTag();

  var fixture = document.getElementById('qunit-fixture');
  fixture.appendChild(videoTag);

  var player = videojs('example_1');
  ok(player.ready !== undefined, 'ready callback is defined');
  player.dispose();
});

test('should export useful components to the public', function () {
  ok(videojs.browser.TOUCH_ENABLED !== undefined, 'Touch detection should be public');
  ok(videojs.getComponent('ControlBar'), 'ControlBar should be public');
  ok(videojs.getComponent('Button'), 'Button should be public');
  ok(videojs.getComponent('PlayToggle'), 'PlayToggle should be public');
  ok(videojs.getComponent('FullscreenToggle'), 'FullscreenToggle should be public');
  ok(videojs.getComponent('BigPlayButton'), 'BigPlayButton should be public');
  ok(videojs.getComponent('LoadingSpinner'), 'LoadingSpinner should be public');
  ok(videojs.getComponent('CurrentTimeDisplay'), 'CurrentTimeDisplay should be public');
  ok(videojs.getComponent('DurationDisplay'), 'DurationDisplay should be public');
  ok(videojs.getComponent('TimeDivider'), 'TimeDivider should be public');
  ok(videojs.getComponent('RemainingTimeDisplay'), 'RemainingTimeDisplay should be public');
  ok(videojs.getComponent('Slider'), 'Slider should be public');
  ok(videojs.getComponent('ProgressControl'), 'ProgressControl should be public');
  ok(videojs.getComponent('SeekBar'), 'SeekBar should be public');
  ok(videojs.getComponent('LoadProgressBar'), 'LoadProgressBar should be public');
  ok(videojs.getComponent('PlayProgressBar'), 'PlayProgressBar should be public');
  ok(videojs.getComponent('VolumeControl'), 'VolumeControl should be public');
  ok(videojs.getComponent('VolumeBar'), 'VolumeBar should be public');
  ok(videojs.getComponent('VolumeLevel'), 'VolumeLevel should be public');
  ok(videojs.getComponent('VolumeMenuButton'), 'VolumeMenuButton should be public');
  ok(videojs.getComponent('MuteToggle'), 'MuteToggle should be public');
  ok(videojs.getComponent('PosterImage'), 'PosterImage should be public');
  ok(videojs.getComponent('Menu'), 'Menu should be public');
  ok(videojs.getComponent('MenuItem'), 'MenuItem should be public');
  ok(videojs.getComponent('MenuButton'), 'MenuButton should be public');
  ok(videojs.getComponent('PlaybackRateMenuButton'), 'PlaybackRateMenuButton should be public');

  ok(videojs.getComponent('CaptionSettingsMenuItem'), 'CaptionSettingsMenuItem should be public');
  ok(videojs.getComponent('OffTextTrackMenuItem'), 'OffTextTrackMenuItem should be public');
  ok(videojs.getComponent('TextTrackMenuItem'), 'TextTrackMenuItem should be public');
  ok(videojs.getComponent('TextTrackDisplay'), 'TextTrackDisplay should be public');
  ok(videojs.getComponent('TextTrackButton'), 'TextTrackButton should be public');
  ok(videojs.getComponent('CaptionsButton'), 'CaptionsButton should be public');
  ok(videojs.getComponent('SubtitlesButton'), 'SubtitlesButton should be public');
  ok(videojs.getComponent('ChaptersButton'), 'ChaptersButton should be public');
  ok(videojs.getComponent('ChaptersTrackMenuItem'), 'ChaptersTrackMenuItem should be public');

  ok(videojs.mergeOptions, 'mergeOptions should be public');
});

test('should be able to initialize player twice on the same tag using string reference', function() {
  var videoTag = testHelperMakeTag();
  var id = videoTag.id;

  var fixture = document.getElementById('qunit-fixture');
  fixture.appendChild(videoTag);

  var player = videojs('example_1');
  player.dispose();
  ok(!document.getElementById(id), 'element is removed');

  videoTag = testHelperMakeTag();
  fixture.appendChild(videoTag);

  player = videojs('example_1');
  player.dispose();
});

test('videojs.getPlayers() should be available after minification', function() {
  var videoTag = testHelperMakeTag();
  var id = videoTag.id;

  var fixture = document.getElementById('qunit-fixture');
  fixture.appendChild(videoTag);

  var player = videojs(id);
  ok(videojs.getPlayers()[id] === player, 'videojs.getPlayers() is available');

  player.dispose();
});

test('component can be subclassed externally', function(){
  var Component = videojs.getComponent('Component');
  var ControlBar = videojs.getComponent('ControlBar');

  var player = new (videojs.extends(Component, {
    reportUserActivity: function(){},
    textTracks: function(){ return {
        addEventListener: Function.prototype,
        removeEventListener: Function.prototype
      };
    }
  }))({
    id: function(){},
    reportUserActivity: function(){}
  });

  ok(new ControlBar(player), 'created a control bar without throwing');
});

function testHelperMakeTag(){
  var videoTag = document.createElement('video');
  videoTag.id = 'example_1';
  videoTag.className = 'video-js vjs-default-skin';
  return videoTag;
}

test('should extend Component', function(){
  var Component = videojs.getComponent('Component');
  var MyComponent = videojs.extends(Component, {
    constructor: function() {
      this.bar = true;
    },
    foo: function() {
      return true;
    }
  });

  var myComponent = new MyComponent();
  ok(myComponent instanceof Component, 'creates an instance of Component');
  ok(myComponent instanceof MyComponent, 'creates an instance of MyComponent');
  ok(myComponent.bar, 'the constructor function is used');
  ok(myComponent.foo(), 'instance methods are applied');

  var NoMethods = videojs.extends(Component);
  var noMethods = new NoMethods({});
  ok(noMethods.on, 'should extend component with no methods or constructor');
});


})();
