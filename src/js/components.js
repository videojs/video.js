var menu, slider, tracks, progress, timedisplay, volume;

menu = require('./menu.js');
slider = require('./slider.js');
tracks = require('./tracks.js');
progress = require('./control-bar/progress-control.js');
timedisplay = require('./control-bar/time-display.js');
volume = require('./control-bar/volume-control.js');

module.exports = {
  Html5: require('./media/html5.js'),
  Flash: require('./media/flash.js'),
  MediaLoader: require('./media/loader.js'),
  MediaTechController: require('./media/media.js'),

  Button: require('./button.js'),
  BigPlayButton: require('./big-play-button.js'),

  ErrorDisplay: require('./error-display.js'),
  MediaError: require('./media-error.js'),

  LoadingSpinner: require('./loading-spinner.js'),

  Menu: menu.Menu,
  MenuItem: menu.MenuItem,
  MenuButton: menu.MenuButton,

  PosterImage: require('./poster.js'),

  Slider: slider.Slider,
  SliderHandle: slider.SliderHandle,

  TextTrack: tracks.TextTrack,
  CaptionsTrack: tracks.CaptionsTrack,
  SubtitlesTrack: tracks.SubtitlesTrack,
  ChaptersTrack: tracks.ChaptersTrack,

  TextTrackDisplay: tracks.TextTrackDisplay,
  TextTrackMenuItem: tracks.TextTrackMenuItem,
  OffTextTrackMenuItem: tracks.OffTextTrackMenuItem,
  ChaptersTrackMenuItem: tracks.ChaptersTrackMenuItem,

  TextTrackButton: tracks.TextTrackButton,
  CaptionsButton: tracks.CaptionsButton,
  SubtitlesButton: tracks.SubtitlesButton,
  ChaptersButton: tracks.ChaptersButton,

  // CONTROL BAR ITEMS
  ControlBar: require('./control-bar/control-bar.js'),
  FullscreenToggle: require('./control-bar/fullscreen-toggle.js'),
  LiveDisplay: require('./control-bar/live-display.js'),
  MuteToggle: require('./control-bar/mute-toggle.js'),
  PlayToggle: require('./control-bar/play-toggle.js'),
  PlaybackRateMenuButton: require('./control-bar/playback-rate-menu-button.js'),

  ProgressControl: progress.ProgressControl,
  SeekBar: progress.SeekBar,
  LoadProgressBar: progress.LoadProgressBar,
  PlayProgressBar: progress.PlayProgressBar,
  SeekHandle: progress.SeekHandle,

  CurrentTimeDisplay: timedisplay.CurrentTimeDisplay,
  DurationDisplay: timedisplay.DurationDisplay,
  TimeDivider: timedisplay.TimeDivider,
  RemainingTimeDisplay: timedisplay.RemainingTimeDisplay,

  VolumeControl: volume.VolumeControl,
  VolumeBar: volume.VolumeBar,
  VolumeLevel: volume.VolumeLevel,
  VolumeHandle: volume.VolumeHandle,
  VolumeMenuButton: require('./control-bar/volume-menu-button.js')
}
