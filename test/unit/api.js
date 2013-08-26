module('Player Minified');

test('should be able to access expected player API methods', function() {
  var player = PlayerTest.makePlayer();

  // Native HTML5 Methods
  ok(player.play, 'play exists');
  ok(player.pause, 'pause exists');
  ok(player.paused, 'paused exists');
  ok(player.src, 'src exists');
  ok(player.currentTime, 'currentTime exists');
  ok(player.duration, 'duration exists');
  ok(player.buffered, 'buffered exists');
  ok(player.volume, 'volume exists');
  ok(player.muted, 'muted exists');
  ok(player.width, 'width exists');
  ok(player.height, 'height exists');
  ok(player.requestFullScreen, 'requestFullScreen exists');
  ok(player.cancelFullScreen, 'cancelFullScreen exists');

  // Added player methods
  ok(player.ready, 'ready exists');
  ok(player.on, 'on exists');
  ok(player.off, 'off exists');
  ok(player.one, 'one exists');
  ok(player.bufferedPercent, 'bufferedPercent exists');
  ok(player.dimensions, 'dimensions exists');
  ok(player.addClass, 'addClass exists');
  ok(player.removeClass, 'removeClass exists');
  ok(player.usingNativeControls, 'usingNativeControls exists');

  player.dispose();
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

test('videojs.players should be availble after minification', function() {
  var videoTag = PlayerTest.makeTag();
  var id = videoTag.id;

  var fixture = document.getElementById('qunit-fixture');
  fixture.appendChild(videoTag);

  var player = videojs(id);
  ok(videojs.players[id] === player, 'videojs.players is available');

  player.dispose();
});
