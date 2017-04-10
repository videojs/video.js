/* eslint-env qunit */
/**
 * These tests run on the minified, window.videojs and ensure the needed
 * APIs still exist
 */
import document from 'global/document';
import window from 'global/window';
const videojs = window.videojs;

QUnit.module('Player API');
QUnit.test('videojs should exist on the window', function(assert) {
  assert.ok(window.videojs, 'videojs exists on the window');
});

QUnit.test('should be able to access expected player API methods', function(assert) {
  const player = videojs.getComponent('Player').prototype;

  // Native HTML5 Methods
  assert.ok(player.error, 'error exists');
  assert.ok(player.src, 'src exists');
  assert.ok(player.currentSrc, 'currentSrc exists');
  assert.ok(player.buffered, 'buffered exists');
  assert.ok(player.load, 'load exists');
  assert.ok(player.seeking, 'seeking exists');
  assert.ok(player.currentTime, 'currentTime exists');
  assert.ok(player.duration, 'duration exists');
  assert.ok(player.paused, 'paused exists');
  assert.ok(player.ended, 'ended exists');
  assert.ok(player.autoplay, 'autoplay exists');
  assert.ok(player.loop, 'loop exists');
  assert.ok(player.play, 'play exists');
  assert.ok(player.pause, 'pause exists');
  assert.ok(player.controls, 'controls exists');
  assert.ok(player.volume, 'volume exists');
  assert.ok(player.muted, 'muted exists');
  assert.ok(player.width, 'width exists');
  assert.ok(player.height, 'height exists');
  assert.ok(player.poster, 'poster exists');
  assert.ok(player.textTracks, 'textTracks exists');
  assert.ok(player.requestFullscreen, 'requestFullscreen exists');
  assert.ok(player.exitFullscreen, 'exitFullscreen exists');
  assert.ok(player.playbackRate, 'playbackRate exists');
  assert.ok(player.networkState, 'networkState exists');
  assert.ok(player.readyState, 'readyState exists');

  // Unsupported Native HTML5 Methods
  // assert.ok(player.canPlayType, 'canPlayType exists');
  // assert.ok(player.startTime, 'startTime exists');
  // assert.ok(player.defaultPlaybackRate, 'defaultPlaybackRate exists');
  // assert.ok(player.playbackRate, 'playbackRate exists');
  // assert.ok(player.played, 'played exists');
  // assert.ok(player.seekable, 'seekable exists');
  // assert.ok(player.videoWidth, 'videoWidth exists');
  // assert.ok(player.videoHeight, 'videoHeight exists');

  // Additional player methods
  assert.ok(player.bufferedPercent, 'bufferedPercent exists');
  assert.ok(player.reportUserActivity, 'reportUserActivity exists');
  assert.ok(player.userActive, 'userActive exists');
  assert.ok(player.usingNativeControls, 'usingNativeControls exists');
  assert.ok(player.isFullscreen, 'isFullscreen exists');
  assert.ok(player.getVideoPlaybackQuality, 'getVideoPlaybackQuality exists');

  // Track methods
  assert.ok(player.audioTracks, 'audioTracks exists');
  assert.ok(player.videoTracks, 'videoTracks exists');
  assert.ok(player.textTracks, 'textTracks exists');
  assert.ok(player.remoteTextTrackEls, 'remoteTextTrackEls exists');
  assert.ok(player.remoteTextTracks, 'remoteTextTracks exists');
  assert.ok(player.addTextTrack, 'addTextTrack exists');
  assert.ok(player.addRemoteTextTrack, 'addRemoteTextTrack exists');
  assert.ok(player.removeRemoteTextTrack, 'removeRemoteTextTrack exists');

  // Deprecated methods that should still exist
  assert.ok(player.requestFullScreen, 'requestFullScreen exists');
  assert.ok(player.isFullScreen, 'isFullScreen exists');
  assert.ok(player.cancelFullScreen, 'cancelFullScreen exists');
});

QUnit.test('should be able to access expected component API methods', function(assert) {
  const Component = videojs.getComponent('Component');
  const comp = new Component({
    id() {
      return 1;
    },
    reportUserActivity() {}
  });

  // Component methods
  assert.ok(comp.player, 'player exists');
  assert.ok(comp.options, 'options exists');
  assert.ok(comp.init, 'init exists');
  assert.ok(comp.dispose, 'dispose exists');
  assert.ok(comp.createEl, 'createEl exists');
  assert.ok(comp.contentEl, 'contentEl exists');
  assert.ok(comp.el, 'el exists');
  assert.ok(comp.addChild, 'addChild exists');
  assert.ok(comp.getChild, 'getChild exists');
  assert.ok(comp.getChildById, 'getChildById exists');
  assert.ok(comp.children, 'children exists');
  assert.ok(comp.initChildren, 'initChildren exists');
  assert.ok(comp.removeChild, 'removeChild exists');
  assert.ok(comp.on, 'on exists');
  assert.ok(comp.off, 'off exists');
  assert.ok(comp.one, 'one exists');
  assert.ok(comp.trigger, 'trigger exists');
  assert.ok(comp.triggerReady, 'triggerReady exists');
  assert.ok(comp.show, 'show exists');
  assert.ok(comp.hide, 'hide exists');
  assert.ok(comp.width, 'width exists');
  assert.ok(comp.height, 'height exists');
  assert.ok(comp.dimensions, 'dimensions exists');
  assert.ok(comp.ready, 'ready exists');
  assert.ok(comp.addClass, 'addClass exists');
  assert.ok(comp.removeClass, 'removeClass exists');
  assert.ok(comp.buildCSSClass, 'buildCSSClass exists');
  assert.ok(comp.setInterval, 'setInterval exists');
  assert.ok(comp.clearInterval, 'clearInterval exists');
  assert.ok(comp.setTimeout, 'setTimeout exists');
  assert.ok(comp.clearTimeout, 'clearTimeout exists');
});

QUnit.test('should be able to access expected MediaTech API methods', function(assert) {
  const media = videojs.getComponent('Tech');
  const mediaProto = media.prototype;
  const html5 = videojs.getComponent('Html5');
  const html5Proto = html5.prototype;

  assert.ok(mediaProto.setPoster, 'setPoster should exist on the Media tech');
  assert.ok(html5Proto.setPoster, 'setPoster should exist on the HTML5 tech');

  assert.ok(html5.patchCanPlayType, 'patchCanPlayType should exist for HTML5');
  assert.ok(html5.unpatchCanPlayType, 'unpatchCanPlayType should exist for HTML5');

  // Source Handler Functions
  assert.ok(media.withSourceHandlers, 'withSourceHandlers should exist for Media Tech');

  assert.ok(html5.canPlaySource, 'canPlaySource should exist for HTML5');
  assert.ok(html5.registerSourceHandler, 'registerSourceHandler should exist for Html5');
  assert.ok(html5.selectSourceHandler, 'selectSourceHandler should exist for Html5');
  assert.ok(html5.prototype.setSource, 'setSource should exist for Html5');
  assert.ok(html5.prototype.disposeSourceHandler,
           'disposeSourceHandler should exist for Html5');
});

QUnit.test('should export ready api call to public', function(assert) {
  const videoTag = testHelperMakeTag();
  const fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(videoTag);

  const player = videojs('example_1');

  assert.ok(player.ready !== undefined, 'ready callback is defined');
  player.dispose();
});

QUnit.test('should export useful components to the public', function(assert) {
  assert.ok(videojs.browser.TOUCH_ENABLED !== undefined,
           'Touch detection should be public');
  assert.ok(videojs.getComponent('ControlBar'), 'ControlBar should be public');
  assert.ok(videojs.getComponent('Button'), 'Button should be public');
  assert.ok(videojs.getComponent('PlayToggle'), 'PlayToggle should be public');
  assert.ok(videojs.getComponent('FullscreenToggle'), 'FullscreenToggle should be public');
  assert.ok(videojs.getComponent('BigPlayButton'), 'BigPlayButton should be public');
  assert.ok(videojs.getComponent('LoadingSpinner'), 'LoadingSpinner should be public');
  assert.ok(videojs.getComponent('CurrentTimeDisplay'),
           'CurrentTimeDisplay should be public');
  assert.ok(videojs.getComponent('DurationDisplay'), 'DurationDisplay should be public');
  assert.ok(videojs.getComponent('TimeDivider'), 'TimeDivider should be public');
  assert.ok(videojs.getComponent('RemainingTimeDisplay'),
           'RemainingTimeDisplay should be public');
  assert.ok(videojs.getComponent('Slider'), 'Slider should be public');
  assert.ok(videojs.getComponent('ProgressControl'), 'ProgressControl should be public');
  assert.ok(videojs.getComponent('SeekBar'), 'SeekBar should be public');
  assert.ok(videojs.getComponent('LoadProgressBar'), 'LoadProgressBar should be public');
  assert.ok(videojs.getComponent('PlayProgressBar'), 'PlayProgressBar should be public');
  assert.ok(videojs.getComponent('VolumeControl'), 'VolumeControl should be public');
  assert.ok(videojs.getComponent('VolumeBar'), 'VolumeBar should be public');
  assert.ok(videojs.getComponent('VolumeLevel'), 'VolumeLevel should be public');
  assert.ok(videojs.getComponent('VolumeMenuButton'), 'VolumeMenuButton should be public');
  assert.ok(videojs.getComponent('MuteToggle'), 'MuteToggle should be public');
  assert.ok(videojs.getComponent('PosterImage'), 'PosterImage should be public');
  assert.ok(videojs.getComponent('Menu'), 'Menu should be public');
  assert.ok(videojs.getComponent('MenuItem'), 'MenuItem should be public');
  assert.ok(videojs.getComponent('MenuButton'), 'MenuButton should be public');
  assert.ok(videojs.getComponent('PlaybackRateMenuButton'),
           'PlaybackRateMenuButton should be public');

  assert.ok(videojs.getComponent('CaptionSettingsMenuItem'),
           'CaptionSettingsMenuItem should be public');
  assert.ok(videojs.getComponent('OffTextTrackMenuItem'),
           'OffTextTrackMenuItem should be public');
  assert.ok(videojs.getComponent('TextTrackMenuItem'),
           'TextTrackMenuItem should be public');
  assert.ok(videojs.getComponent('TextTrackDisplay'), 'TextTrackDisplay should be public');
  assert.ok(videojs.getComponent('TextTrackButton'), 'TextTrackButton should be public');
  assert.ok(videojs.getComponent('CaptionsButton'), 'CaptionsButton should be public');
  assert.ok(videojs.getComponent('SubtitlesButton'), 'SubtitlesButton should be public');
  assert.ok(videojs.getComponent('DescriptionsButton'),
           'DescriptionsButton should be public');
  assert.ok(videojs.getComponent('ChaptersButton'), 'ChaptersButton should be public');
  assert.ok(videojs.getComponent('ChaptersTrackMenuItem'),
           'ChaptersTrackMenuItem should be public');

  assert.ok(videojs.mergeOptions, 'mergeOptions should be public');
});

QUnit.test('should be able to initialize player twice on the same tag using string reference', function(assert) {
  const videoTag = testHelperMakeTag();
  const id = videoTag.id;
  const fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(videoTag);

  const player = videojs('example_1');

  player.dispose();
  assert.ok(!document.getElementById(id), 'element is removed');

  videoTag = testHelperMakeTag();
  fixture.appendChild(videoTag);

  player = videojs('example_1');
  player.dispose();
});

QUnit.test('videojs.getPlayers() should be available after minification', function(assert) {
  const videoTag = testHelperMakeTag();
  const id = videoTag.id;
  const fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(videoTag);

  const player = videojs(id);

  assert.ok(videojs.getPlayers()[id] === player, 'videojs.getPlayers() is available');

  player.dispose();
});

QUnit.test('component can be subclassed externally', function(assert) {
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

  assert.ok(new ControlBar(player), 'created a control bar without throwing');
});

function testHelperMakeTag() {
  const videoTag = document.createElement('video');

  videoTag.id = 'example_1';
  videoTag.className = 'video-js vjs-default-skin';
  return videoTag;
}

QUnit.test('should extend Component', function(assert) {
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

  assert.ok(myComponent instanceof Component, 'creates an instance of Component');
  assert.ok(myComponent instanceof MyComponent, 'creates an instance of MyComponent');
  assert.ok(myComponent.bar, 'the constructor function is used');
  assert.ok(myComponent.foo(), 'instance methods are applied');

  const NoMethods = videojs.extend(Component);
  const noMethods = new NoMethods({});

  assert.ok(noMethods.on, 'should extend component with no methods or constructor');
});
