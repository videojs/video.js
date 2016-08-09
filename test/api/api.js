/* eslint-env qunit */
/**
 * These tests run on the minified, window.videojs and ensure the needed
 * APIs still exist
 */
import document from 'global/document';
import window from 'global/window';
const videojs = window.videojs;

QUnit.module('Player API');
QUnit.test('videojs should exist on the window', function() {
  QUnit.ok(window.videojs, 'videojs exists on the window');
});

QUnit.test('should be able to access expected player API methods', function() {
  const player = videojs.getComponent('Player').prototype;

  // Native HTML5 Methods
  QUnit.ok(player.error, 'error exists');
  QUnit.ok(player.src, 'src exists');
  QUnit.ok(player.currentSrc, 'currentSrc exists');
  QUnit.ok(player.buffered, 'buffered exists');
  QUnit.ok(player.load, 'load exists');
  QUnit.ok(player.seeking, 'seeking exists');
  QUnit.ok(player.currentTime, 'currentTime exists');
  QUnit.ok(player.duration, 'duration exists');
  QUnit.ok(player.paused, 'paused exists');
  QUnit.ok(player.ended, 'ended exists');
  QUnit.ok(player.autoplay, 'autoplay exists');
  QUnit.ok(player.loop, 'loop exists');
  QUnit.ok(player.play, 'play exists');
  QUnit.ok(player.pause, 'pause exists');
  QUnit.ok(player.controls, 'controls exists');
  QUnit.ok(player.volume, 'volume exists');
  QUnit.ok(player.muted, 'muted exists');
  QUnit.ok(player.width, 'width exists');
  QUnit.ok(player.height, 'height exists');
  QUnit.ok(player.poster, 'poster exists');
  QUnit.ok(player.textTracks, 'textTracks exists');
  QUnit.ok(player.requestFullscreen, 'requestFullscreen exists');
  QUnit.ok(player.exitFullscreen, 'exitFullscreen exists');
  QUnit.ok(player.playbackRate, 'playbackRate exists');
  QUnit.ok(player.networkState, 'networkState exists');
  QUnit.ok(player.readyState, 'readyState exists');

  // Unsupported Native HTML5 Methods
  // QUnit.ok(player.canPlayType, 'canPlayType exists');
  // QUnit.ok(player.startTime, 'startTime exists');
  // QUnit.ok(player.defaultPlaybackRate, 'defaultPlaybackRate exists');
  // QUnit.ok(player.playbackRate, 'playbackRate exists');
  // QUnit.ok(player.played, 'played exists');
  // QUnit.ok(player.seekable, 'seekable exists');
  // QUnit.ok(player.videoWidth, 'videoWidth exists');
  // QUnit.ok(player.videoHeight, 'videoHeight exists');

  // Additional player methods
  QUnit.ok(player.bufferedPercent, 'bufferedPercent exists');
  QUnit.ok(player.reportUserActivity, 'reportUserActivity exists');
  QUnit.ok(player.userActive, 'userActive exists');
  QUnit.ok(player.usingNativeControls, 'usingNativeControls exists');
  QUnit.ok(player.isFullscreen, 'isFullscreen exists');

  // Track methods
  QUnit.ok(player.audioTracks, 'audioTracks exists');
  QUnit.ok(player.videoTracks, 'videoTracks exists');
  QUnit.ok(player.textTracks, 'textTracks exists');
  QUnit.ok(player.remoteTextTrackEls, 'remoteTextTrackEls exists');
  QUnit.ok(player.remoteTextTracks, 'remoteTextTracks exists');
  QUnit.ok(player.addTextTrack, 'addTextTrack exists');
  QUnit.ok(player.addRemoteTextTrack, 'addRemoteTextTrack exists');
  QUnit.ok(player.removeRemoteTextTrack, 'removeRemoteTextTrack exists');

  // Deprecated methods that should still exist
  QUnit.ok(player.requestFullScreen, 'requestFullScreen exists');
  QUnit.ok(player.isFullScreen, 'isFullScreen exists');
  QUnit.ok(player.cancelFullScreen, 'cancelFullScreen exists');
});

QUnit.test('should be able to access expected component API methods', function() {
  const Component = videojs.getComponent('Component');
  const comp = new Component({
    id() {
      return 1;
    },
    reportUserActivity() {}
  });

  // Component methods
  QUnit.ok(comp.player, 'player exists');
  QUnit.ok(comp.options, 'options exists');
  QUnit.ok(comp.init, 'init exists');
  QUnit.ok(comp.dispose, 'dispose exists');
  QUnit.ok(comp.createEl, 'createEl exists');
  QUnit.ok(comp.contentEl, 'contentEl exists');
  QUnit.ok(comp.el, 'el exists');
  QUnit.ok(comp.addChild, 'addChild exists');
  QUnit.ok(comp.getChild, 'getChild exists');
  QUnit.ok(comp.getChildById, 'getChildById exists');
  QUnit.ok(comp.children, 'children exists');
  QUnit.ok(comp.initChildren, 'initChildren exists');
  QUnit.ok(comp.removeChild, 'removeChild exists');
  QUnit.ok(comp.on, 'on exists');
  QUnit.ok(comp.off, 'off exists');
  QUnit.ok(comp.one, 'one exists');
  QUnit.ok(comp.trigger, 'trigger exists');
  QUnit.ok(comp.triggerReady, 'triggerReady exists');
  QUnit.ok(comp.show, 'show exists');
  QUnit.ok(comp.hide, 'hide exists');
  QUnit.ok(comp.width, 'width exists');
  QUnit.ok(comp.height, 'height exists');
  QUnit.ok(comp.dimensions, 'dimensions exists');
  QUnit.ok(comp.ready, 'ready exists');
  QUnit.ok(comp.addClass, 'addClass exists');
  QUnit.ok(comp.removeClass, 'removeClass exists');
  QUnit.ok(comp.buildCSSClass, 'buildCSSClass exists');
  QUnit.ok(comp.setInterval, 'setInterval exists');
  QUnit.ok(comp.clearInterval, 'clearInterval exists');
  QUnit.ok(comp.setTimeout, 'setTimeout exists');
  QUnit.ok(comp.clearTimeout, 'clearTimeout exists');
});

QUnit.test('should be able to access expected MediaTech API methods', function() {
  const media = videojs.getComponent('Tech');
  const mediaProto = media.prototype;
  const html5 = videojs.getComponent('Html5');
  const html5Proto = html5.prototype;
  const flash = videojs.getComponent('Flash');
  const flashProto = flash.prototype;

  QUnit.ok(mediaProto.setPoster, 'setPoster should exist on the Media tech');
  QUnit.ok(html5Proto.setPoster, 'setPoster should exist on the HTML5 tech');
  QUnit.ok(flashProto.setPoster, 'setPoster should exist on the Flash tech');

  QUnit.ok(html5.patchCanPlayType, 'patchCanPlayType should exist for HTML5');
  QUnit.ok(html5.unpatchCanPlayType, 'unpatchCanPlayType should exist for HTML5');

  // Source Handler Functions
  QUnit.ok(media.withSourceHandlers, 'withSourceHandlers should exist for Media Tech');

  QUnit.ok(html5.canPlaySource, 'canPlaySource should exist for HTML5');
  QUnit.ok(html5.registerSourceHandler, 'registerSourceHandler should exist for Html5');
  QUnit.ok(html5.selectSourceHandler, 'selectSourceHandler should exist for Html5');
  QUnit.ok(html5.prototype.setSource, 'setSource should exist for Html5');
  QUnit.ok(html5.prototype.disposeSourceHandler,
           'disposeSourceHandler should exist for Html5');

  QUnit.ok(flash.canPlaySource, 'canPlaySource should exist for Flash');
  QUnit.ok(flash.registerSourceHandler, 'registerSourceHandler should exist for Flash');
  QUnit.ok(flash.selectSourceHandler, 'selectSourceHandler should exist for Flash');
  QUnit.ok(flash.prototype.setSource, 'setSource should exist for Flash');
  QUnit.ok(flash.prototype.disposeSourceHandler,
           'disposeSourceHandler should exist for Flash');
});

QUnit.test('should export ready api call to public', function() {
  const videoTag = testHelperMakeTag();
  const fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(videoTag);

  const player = videojs('example_1');

  QUnit.ok(player.ready !== undefined, 'ready callback is defined');
  player.dispose();
});

QUnit.test('should export useful components to the public', function() {
  QUnit.ok(videojs.browser.TOUCH_ENABLED !== undefined,
           'Touch detection should be public');
  QUnit.ok(videojs.getComponent('ControlBar'), 'ControlBar should be public');
  QUnit.ok(videojs.getComponent('Button'), 'Button should be public');
  QUnit.ok(videojs.getComponent('PlayToggle'), 'PlayToggle should be public');
  QUnit.ok(videojs.getComponent('FullscreenToggle'), 'FullscreenToggle should be public');
  QUnit.ok(videojs.getComponent('BigPlayButton'), 'BigPlayButton should be public');
  QUnit.ok(videojs.getComponent('LoadingSpinner'), 'LoadingSpinner should be public');
  QUnit.ok(videojs.getComponent('CurrentTimeDisplay'),
           'CurrentTimeDisplay should be public');
  QUnit.ok(videojs.getComponent('DurationDisplay'), 'DurationDisplay should be public');
  QUnit.ok(videojs.getComponent('TimeDivider'), 'TimeDivider should be public');
  QUnit.ok(videojs.getComponent('RemainingTimeDisplay'),
           'RemainingTimeDisplay should be public');
  QUnit.ok(videojs.getComponent('Slider'), 'Slider should be public');
  QUnit.ok(videojs.getComponent('ProgressControl'), 'ProgressControl should be public');
  QUnit.ok(videojs.getComponent('SeekBar'), 'SeekBar should be public');
  QUnit.ok(videojs.getComponent('LoadProgressBar'), 'LoadProgressBar should be public');
  QUnit.ok(videojs.getComponent('PlayProgressBar'), 'PlayProgressBar should be public');
  QUnit.ok(videojs.getComponent('VolumeControl'), 'VolumeControl should be public');
  QUnit.ok(videojs.getComponent('VolumeBar'), 'VolumeBar should be public');
  QUnit.ok(videojs.getComponent('VolumeLevel'), 'VolumeLevel should be public');
  QUnit.ok(videojs.getComponent('VolumeMenuButton'), 'VolumeMenuButton should be public');
  QUnit.ok(videojs.getComponent('MuteToggle'), 'MuteToggle should be public');
  QUnit.ok(videojs.getComponent('PosterImage'), 'PosterImage should be public');
  QUnit.ok(videojs.getComponent('Menu'), 'Menu should be public');
  QUnit.ok(videojs.getComponent('MenuItem'), 'MenuItem should be public');
  QUnit.ok(videojs.getComponent('MenuButton'), 'MenuButton should be public');
  QUnit.ok(videojs.getComponent('PlaybackRateMenuButton'),
           'PlaybackRateMenuButton should be public');

  QUnit.ok(videojs.getComponent('CaptionSettingsMenuItem'),
           'CaptionSettingsMenuItem should be public');
  QUnit.ok(videojs.getComponent('OffTextTrackMenuItem'),
           'OffTextTrackMenuItem should be public');
  QUnit.ok(videojs.getComponent('TextTrackMenuItem'),
           'TextTrackMenuItem should be public');
  QUnit.ok(videojs.getComponent('TextTrackDisplay'), 'TextTrackDisplay should be public');
  QUnit.ok(videojs.getComponent('TextTrackButton'), 'TextTrackButton should be public');
  QUnit.ok(videojs.getComponent('CaptionsButton'), 'CaptionsButton should be public');
  QUnit.ok(videojs.getComponent('SubtitlesButton'), 'SubtitlesButton should be public');
  QUnit.ok(videojs.getComponent('DescriptionsButton'),
           'DescriptionsButton should be public');
  QUnit.ok(videojs.getComponent('ChaptersButton'), 'ChaptersButton should be public');
  QUnit.ok(videojs.getComponent('ChaptersTrackMenuItem'),
           'ChaptersTrackMenuItem should be public');

  QUnit.ok(videojs.mergeOptions, 'mergeOptions should be public');
});

QUnit.test('should be able to initialize player twice on the same tag using string reference', function() {
  const videoTag = testHelperMakeTag();
  const id = videoTag.id;
  const fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(videoTag);

  const player = videojs('example_1');

  player.dispose();
  QUnit.ok(!document.getElementById(id), 'element is removed');

  videoTag = testHelperMakeTag();
  fixture.appendChild(videoTag);

  player = videojs('example_1');
  player.dispose();
});

QUnit.test('videojs.getPlayers() should be available after minification', function() {
  const videoTag = testHelperMakeTag();
  const id = videoTag.id;
  const fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(videoTag);

  const player = videojs(id);

  QUnit.ok(videojs.getPlayers()[id] === player, 'videojs.getPlayers() is available');

  player.dispose();
});

QUnit.test('component can be subclassed externally', function() {
  const Component = videojs.getComponent('Component');
  const ControlBar = videojs.getComponent('ControlBar');

  const player = new (videojs.extend(Component, {
    reportUserActivity() {},
    textTracks() {
      return {
        addEventListener: Function.prototype,
        removeEventListener: Function.prototype
      };
    }
  }))({
    id() {},
    reportUserActivity() {}
  });

  QUnit.ok(new ControlBar(player), 'created a control bar without throwing');
});

function testHelperMakeTag() {
  const videoTag = document.createElement('video');

  videoTag.id = 'example_1';
  videoTag.className = 'video-js vjs-default-skin';
  return videoTag;
}

QUnit.test('should extend Component', function() {
  const Component = videojs.getComponent('Component');
  const MyComponent = videojs.extend(Component, {
    constructor() {
      this.bar = true;
    },
    foo() {
      return true;
    }
  });

  const myComponent = new MyComponent();

  QUnit.ok(myComponent instanceof Component, 'creates an instance of Component');
  QUnit.ok(myComponent instanceof MyComponent, 'creates an instance of MyComponent');
  QUnit.ok(myComponent.bar, 'the constructor function is used');
  QUnit.ok(myComponent.foo(), 'instance methods are applied');

  const NoMethods = videojs.extend(Component);
  const noMethods = new NoMethods({});

  QUnit.ok(noMethods.on, 'should extend component with no methods or constructor');
});
