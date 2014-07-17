var vjs = {};

vjs.Html5 = require('./media/html5.js');
vjs.Flash = require('./media/flash.js');
vjs.MediaLoader = require('./media/loader.js');
vjs.MediaTechController = require('./media/media.js');

vjs.BigPlayButton = require('./big-play-button.js');
vjs.Button = require('./button.js');

vjs.ErrorDisplay = require('./error-display.js');

vjs.LoadingSpinner = require('./loading-spinner.js');

var menu = require('./menu.js');
vjs.Menu = menu.Menu;
vjs.MenuItem = menu.MenuItem;
vjs.MenuButton = menu.MenuButton;

vjs.PosterImage = require('./poster.js')

var slider = require('./slider.js');
vjs.Slider = slider.Slider;
vjs.SliderHandle = slider.SliderHandle;

var tracks = require('./tracks.js');
vjs.TextTrack = tracks.TextTrack;
vjs.CaptionsTrack = tracks.CaptionsTrack;
vjs.SubtitlesTrack = tracks.SubtitlesTrack;
vjs.ChaptersTrack = tracks.ChaptersTrack;

vjs.TextTrackDisplay = tracks.TextTrackDisplay;
vjs.TextTrackMenuItem = tracks.TextTrackMenuItem;
vjs.OffTextTrackMenuItem = tracks.OffTextTrackMenuItem;
vjs.TextTrackButton = tracks.TextTrackButton;

vjs.CaptionsButton = tracks.CaptionsButton;
vjs.SubtitlesButton = tracks.SubtitlesButton;
vjs.ChaptersButton = tracks.ChaptersButton;

vjs.ChaptersTrackMenuItem = tracks.ChaptersTrackMenuItem;

// CONTROL BAR ITEMS
vjs.ControlBar = require('./control-bar/control-bar.js');
vjs.FullscreenToggle = require('./control-bar/fullscreen-toggle.js');
vjs.LiveDisplay = require('./control-bar/live-display.js');
vjs.MuteToggle = require('./control-bar/mute-toggle.js');
vjs.PlayToggle = require('./control-bar/play-toggle.js');
vjs.PlaybackRateMenuButton = require('./control-bar/playback-rate-menu-button.js');

var progress = require('./control-bar/progress-control.js');
vjs.ProgressControl = progress.ProgressControl;
vjs.SeekBar = progress.SeekBar;
vjs.LoadProgressBar = progress.LoadProgressBar;
vjs.PlayProgressBar = progress.PlayProgressBar;
vjs.SeekHandle = progress.SeekHandle;

var timedisplay = require('./control-bar/time-display.js');
vjs.CurrentTimeDisplay = timedisplay.CurrentTimeDisplay;
vjs.DurationDisplay = timedisplay.DurationDisplay;
vjs.TimeDivider = timedisplay.TimeDivider;
vjs.RemainingTimeDisplay = timedisplay.RemainingTimeDisplay;

var volume = require('./control-bar/volume-control.js');
vjs.VolumeControl = volume.VolumeControl;
vjs.VolumeBar = volume.VolumeBar;
vjs.VolumeLevel = volume.VolumeLevel;
vjs.VolumeHandle = volume.VolumeHandle;
vjs.VolumeMenuButton = require('./control-bar/volume-menu-button.js');


module.exports = vjs;
