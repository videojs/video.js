module('Player Minified');

test('should be able to access expected player API methods', function() {
  var player = PlayerTest.makePlayer();

  // Native HTML5 Methods
  ok(player.error, 'error exists');
  ok(player.src, 'src exists');
  ok(player.currentSrc, 'currentSrc exists');
  ok(player.buffered, 'buffered exists');
  ok(player.load, 'load exists');
  ok(player.seeking, 'seeking exists');
  ok(player.seekable, 'seekable exists');
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

  player.dispose();
});

test('should be able to access expected component API methods', function() {
  var comp = videojs.Component.create({ id: function(){ return 1; }, reportUserActivity: function(){} });

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
  var media = videojs.MediaTechController;
  var mediaProto = videojs.MediaTechController.prototype;
  var html5 = videojs.Html5;
  var html5Proto = videojs.Html5.prototype;
  var flash = videojs.Flash;
  var flashProto = videojs.Flash.prototype;

  ok(mediaProto.setPoster, 'setPoster should exist on the Media tech');
  ok(html5Proto.setPoster, 'setPoster should exist on the HTML5 tech');
  ok(flashProto.setPoster, 'setPoster should exist on the Flash tech');

  ok(videojs.Html5.patchCanPlayType, 'patchCanPlayType should exist for HTML5');
  ok(videojs.Html5.unpatchCanPlayType, 'unpatchCanPlayType should exist for HTML5');

  // Source Handler Functions
  ok(media['withSourceHandlers'], 'withSourceHandlers should exist for Media Tech');

  ok(videojs.Html5.canPlaySource, 'canPlaySource should exist for HTML5');
  ok(videojs.Html5['registerSourceHandler'], 'registerSourceHandler should exist for Html5');
  ok(videojs.Html5.selectSourceHandler, 'selectSourceHandler should exist for Html5');
  ok(videojs.Html5.prototype.setSource, 'setSource should exist for Html5');
  ok(videojs.Html5.prototype.disposeSourceHandler, 'disposeSourceHandler should exist for Html5');

  ok(videojs.Flash.canPlaySource, 'canPlaySource should exist for Flash');
  ok(videojs.Flash['registerSourceHandler'], 'registerSourceHandler should exist for Flash');
  ok(videojs.Flash.selectSourceHandler, 'selectSourceHandler should exist for Flash');
  ok(videojs.Flash.prototype.setSource, 'setSource should exist for Flash');
  ok(videojs.Flash.prototype.disposeSourceHandler, 'disposeSourceHandler should exist for Flash');
});

test('should export ready api call to public', function() {
  var videoTag = PlayerTest.makeTag();

  var fixture = document.getElementById('qunit-fixture');
  fixture.appendChild(videoTag);

  var player = videojs('example_1');
  ok(player.ready !== undefined, 'ready callback is defined');
  player.dispose();
});

test('should export useful components to the public', function () {
  ok(videojs.TOUCH_ENABLED !== undefined, 'Touch detection should be public');
  ok(videojs.ControlBar, 'ControlBar should be public');
  ok(videojs.Button, 'Button should be public');
  ok(videojs.PlayToggle, 'PlayToggle should be public');
  ok(videojs.FullscreenToggle, 'FullscreenToggle should be public');
  ok(videojs.BigPlayButton, 'BigPlayButton should be public');
  ok(videojs.LoadingSpinner, 'LoadingSpinner should be public');
  ok(videojs.CurrentTimeDisplay, 'CurrentTimeDisplay should be public');
  ok(videojs.DurationDisplay, 'DurationDisplay should be public');
  ok(videojs.TimeDivider, 'TimeDivider should be public');
  ok(videojs.RemainingTimeDisplay, 'RemainingTimeDisplay should be public');
  ok(videojs.Slider, 'Slider should be public');
  ok(videojs.ProgressControl, 'ProgressControl should be public');
  ok(videojs.SeekBar, 'SeekBar should be public');
  ok(videojs.LoadProgressBar, 'LoadProgressBar should be public');
  ok(videojs.PlayProgressBar, 'PlayProgressBar should be public');
  ok(videojs.SeekHandle, 'SeekHandle should be public');
  ok(videojs.VolumeControl, 'VolumeControl should be public');
  ok(videojs.VolumeBar, 'VolumeBar should be public');
  ok(videojs.VolumeLevel, 'VolumeLevel should be public');
  ok(videojs.VolumeMenuButton, 'VolumeMenuButton should be public');
  ok(videojs.VolumeHandle, 'VolumeHandle should be public');
  ok(videojs.MuteToggle, 'MuteToggle should be public');
  ok(videojs.PosterImage, 'PosterImage should be public');
  ok(videojs.Menu, 'Menu should be public');
  ok(videojs.MenuItem, 'MenuItem should be public');
  ok(videojs.MenuButton, 'MenuButton should be public');
  ok(videojs.PlaybackRateMenuButton, 'PlaybackRateMenuButton should be public');

  ok(videojs.CaptionSettingsMenuItem, 'CaptionSettingsMenuItem should be public');
  ok(videojs.OffTextTrackMenuItem, 'OffTextTrackMenuItem should be public');
  ok(videojs.TextTrackMenuItem, 'TextTrackMenuItem should be public');
  ok(videojs.TextTrackDisplay, 'TextTrackDisplay should be public');
  ok(videojs.TextTrackButton, 'TextTrackButton should be public');
  ok(videojs.CaptionsButton, 'CaptionsButton should be public');
  ok(videojs.SubtitlesButton, 'SubtitlesButton should be public');
  ok(videojs.ChaptersButton, 'ChaptersButton should be public');
  ok(videojs.ChaptersTrackMenuItem, 'ChaptersTrackMenuItem should be public');

  ok(videojs.util, 'util namespace should be public');
  ok(videojs.util.mergeOptions, 'mergeOptions should be public');
});

test('should be able to initialize player twice on the same tag using string reference', function() {
  var videoTag = PlayerTest.makeTag();
  var id = videoTag.id;

  var fixture = document.getElementById('qunit-fixture');
  fixture.appendChild(videoTag);

  var player = videojs('example_1');
  player.dispose();
  ok(!document.getElementById(id), 'element is removed');

  videoTag = PlayerTest.makeTag();
  fixture.appendChild(videoTag);

  player = videojs('example_1');
  player.dispose();
});

test('videojs.players should be available after minification', function() {
  var videoTag = PlayerTest.makeTag();
  var id = videoTag.id;

  var fixture = document.getElementById('qunit-fixture');
  fixture.appendChild(videoTag);

  var player = videojs(id);
  ok(videojs.players[id] === player, 'videojs.players is available');

  player.dispose();
});

// NOTE: This test could be removed after we've landed on a permanent
// externs/exports strategy. See comment on videojs/video.js#853
test('fullscreenToggle does not depend on minified player methods', function(){
  var noop, player, fullscreen, requestFullscreen, exitFullscreen, isFullscreen_;
  noop = function(){};
  requestFullscreen = false;
  exitFullscreen = false;

  player = PlayerTest.makePlayer();

  player['requestFullscreen'] = function(){
    requestFullscreen = true;
  };
  player['exitFullscreen'] = function(){
    exitFullscreen = true;
  };

  isFullscreen_ = false;
  player['isFullscreen'] = function(){
    return isFullscreen_;
  };

  fullscreen = new videojs.FullscreenToggle(player);
  fullscreen.trigger('click');

  ok(requestFullscreen, 'requestFullscreen called');

  isFullscreen_ = true;
  fullscreen.trigger('click');

  ok(exitFullscreen, 'exitFullscreen called');
});

test('component can be subclassed externally', function(){
  var player = new (videojs.Component.extend({
    languages: function(){},
    reportUserActivity: function(){},
    language: function(){},
    textTracks: function(){ return {
        addEventListener: Function.prototype,
        removeEventListener: Function.prototype
      };
    }
  }))({
    id: function(){},
    reportUserActivity: function(){}
  });
  ok(new videojs.ControlBar(player), 'created a control bar without throwing');
});
