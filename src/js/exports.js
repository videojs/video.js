/**
 * @fileoverview Exports for Video.js.
 * Exports are publicly available variables.
 * All other variables (including function names) will probably
 * be renamed by closure compiler.
 */

/**
 * vjs (internal only) = videojs = _V_ (external only)
 *
 * vjs is the same as the goog var in Closure Library. It holds all variables
 * used in Video.js development. Closure compiler will rename all variables,
 * including class prototype functions, except those specifically
 * exported (eports.js). Don't assume any function you can use in Video.js
 * development will be available on window.videojs for use with other js.
 *
 * For example, vjs.trim is an internal function and will be renamed by compiler
 * to something like 'a.b', or actually more likely 'a' removing it from
 * a parent object.
 *
 * videojs is a var that helps bridge between internal and external development.
 * Avoid using it over vjs when developing the Video.js core.
 *
 * _V_ is only external. It's just cute and short(er). Like jQuery === $.
 * Also because it's nice having a different var for internal (vjs) vs.
 * external (_V_) because it makes it clearer what context we're in.
 */
goog.exportSymbol('videojs', vjs);
goog.exportSymbol('_V_', vjs);

goog.exportSymbol('videojs.options', vjs.options);
goog.exportSymbol('videojs.players', vjs.players);
goog.exportSymbol('videojs.TOUCH_ENABLED', vjs.TOUCH_ENABLED);

// Allow external components to use global cache
goog.exportSymbol('videojs.cache', vjs.cache);

// goog.exportSymbol('videojs.CoreObject', vjs.CoreObject);
// goog.exportProperty(vjs.CoreObject, 'create', vjs.CoreObject.create);

goog.exportSymbol('videojs.Component', vjs.Component);
// already in default externs: id, name
goog.exportProperty(vjs.Component.prototype, 'player', vjs.Component.prototype.player);
goog.exportProperty(vjs.Component.prototype, 'options', vjs.Component.prototype.options);
goog.exportProperty(vjs.Component.prototype, 'init', vjs.Component.prototype.init);
goog.exportProperty(vjs.Component.prototype, 'dispose', vjs.Component.prototype.dispose);
goog.exportProperty(vjs.Component.prototype, 'createEl', vjs.Component.prototype.createEl);
goog.exportProperty(vjs.Component.prototype, 'contentEl', vjs.Component.prototype.contentEl);
goog.exportProperty(vjs.Component.prototype, 'el', vjs.Component.prototype.el);
goog.exportProperty(vjs.Component.prototype, 'addChild', vjs.Component.prototype.addChild);
goog.exportProperty(vjs.Component.prototype, 'getChild', vjs.Component.prototype.getChild);
goog.exportProperty(vjs.Component.prototype, 'getChildById', vjs.Component.prototype.getChildById);
goog.exportProperty(vjs.Component.prototype, 'children', vjs.Component.prototype.children);
goog.exportProperty(vjs.Component.prototype, 'initChildren', vjs.Component.prototype.initChildren);
goog.exportProperty(vjs.Component.prototype, 'removeChild', vjs.Component.prototype.removeChild);
goog.exportProperty(vjs.Component.prototype, 'on', vjs.Component.prototype.on);
goog.exportProperty(vjs.Component.prototype, 'off', vjs.Component.prototype.off);
goog.exportProperty(vjs.Component.prototype, 'one', vjs.Component.prototype.one);
goog.exportProperty(vjs.Component.prototype, 'trigger', vjs.Component.prototype.trigger);
goog.exportProperty(vjs.Component.prototype, 'triggerReady', vjs.Component.prototype.triggerReady);
goog.exportProperty(vjs.Component.prototype, 'show', vjs.Component.prototype.show);
goog.exportProperty(vjs.Component.prototype, 'hide', vjs.Component.prototype.hide);
goog.exportProperty(vjs.Component.prototype, 'width', vjs.Component.prototype.width);
goog.exportProperty(vjs.Component.prototype, 'height', vjs.Component.prototype.height);
goog.exportProperty(vjs.Component.prototype, 'dimensions', vjs.Component.prototype.dimensions);
goog.exportProperty(vjs.Component.prototype, 'ready', vjs.Component.prototype.ready);
goog.exportProperty(vjs.Component.prototype, 'addClass', vjs.Component.prototype.addClass);
goog.exportProperty(vjs.Component.prototype, 'removeClass', vjs.Component.prototype.removeClass);
goog.exportProperty(vjs.Component.prototype, 'buildCSSClass', vjs.Component.prototype.buildCSSClass);
goog.exportProperty(vjs.Component.prototype, 'localize', vjs.Component.prototype.localize);
goog.exportProperty(vjs.Component.prototype, 'setInterval', vjs.Component.prototype.setInterval);
goog.exportProperty(vjs.Component.prototype, 'setTimeout', vjs.Component.prototype.setTimeout);

// Need to export ended to ensure it's not removed by CC, since it's not used internally
goog.exportProperty(vjs.Player.prototype, 'ended', vjs.Player.prototype.ended);
goog.exportProperty(vjs.Player.prototype, 'enterFullWindow', vjs.Player.prototype.enterFullWindow);
goog.exportProperty(vjs.Player.prototype, 'exitFullWindow', vjs.Player.prototype.exitFullWindow);
goog.exportProperty(vjs.Player.prototype, 'preload', vjs.Player.prototype.preload);
goog.exportProperty(vjs.Player.prototype, 'remainingTime', vjs.Player.prototype.remainingTime);
goog.exportProperty(vjs.Player.prototype, 'supportsFullScreen', vjs.Player.prototype.supportsFullScreen);
goog.exportProperty(vjs.Player.prototype, 'currentType', vjs.Player.prototype.currentType);
goog.exportProperty(vjs.Player.prototype, 'requestFullScreen', vjs.Player.prototype.requestFullScreen);
goog.exportProperty(vjs.Player.prototype, 'requestFullscreen', vjs.Player.prototype.requestFullscreen);
goog.exportProperty(vjs.Player.prototype, 'cancelFullScreen', vjs.Player.prototype.cancelFullScreen);
goog.exportProperty(vjs.Player.prototype, 'exitFullscreen', vjs.Player.prototype.exitFullscreen);
goog.exportProperty(vjs.Player.prototype, 'isFullScreen', vjs.Player.prototype.isFullScreen);
goog.exportProperty(vjs.Player.prototype, 'isFullscreen', vjs.Player.prototype.isFullscreen);

goog.exportSymbol('videojs.MediaLoader', vjs.MediaLoader);
goog.exportSymbol('videojs.TextTrackDisplay', vjs.TextTrackDisplay);

goog.exportSymbol('videojs.ControlBar', vjs.ControlBar);
goog.exportSymbol('videojs.Button', vjs.Button);
goog.exportSymbol('videojs.PlayToggle', vjs.PlayToggle);
goog.exportSymbol('videojs.FullscreenToggle', vjs.FullscreenToggle);
goog.exportSymbol('videojs.BigPlayButton', vjs.BigPlayButton);
goog.exportSymbol('videojs.LoadingSpinner', vjs.LoadingSpinner);
goog.exportSymbol('videojs.CurrentTimeDisplay', vjs.CurrentTimeDisplay);
goog.exportSymbol('videojs.DurationDisplay', vjs.DurationDisplay);
goog.exportSymbol('videojs.TimeDivider', vjs.TimeDivider);
goog.exportSymbol('videojs.RemainingTimeDisplay', vjs.RemainingTimeDisplay);
goog.exportSymbol('videojs.LiveDisplay', vjs.LiveDisplay);
goog.exportSymbol('videojs.ErrorDisplay', vjs.ErrorDisplay);
goog.exportSymbol('videojs.Slider', vjs.Slider);
goog.exportSymbol('videojs.ProgressControl', vjs.ProgressControl);
goog.exportSymbol('videojs.SeekBar', vjs.SeekBar);
goog.exportSymbol('videojs.LoadProgressBar', vjs.LoadProgressBar);
goog.exportSymbol('videojs.PlayProgressBar', vjs.PlayProgressBar);
goog.exportSymbol('videojs.SeekHandle', vjs.SeekHandle);
goog.exportSymbol('videojs.VolumeControl', vjs.VolumeControl);
goog.exportSymbol('videojs.VolumeBar', vjs.VolumeBar);
goog.exportSymbol('videojs.VolumeLevel', vjs.VolumeLevel);
goog.exportSymbol('videojs.VolumeMenuButton', vjs.VolumeMenuButton);
goog.exportSymbol('videojs.VolumeHandle', vjs.VolumeHandle);
goog.exportSymbol('videojs.MuteToggle', vjs.MuteToggle);
goog.exportSymbol('videojs.PosterImage', vjs.PosterImage);
goog.exportSymbol('videojs.Menu', vjs.Menu);
goog.exportSymbol('videojs.MenuItem', vjs.MenuItem);
goog.exportSymbol('videojs.MenuButton', vjs.MenuButton);
goog.exportSymbol('videojs.PlaybackRateMenuButton', vjs.PlaybackRateMenuButton);
goog.exportProperty(vjs.MenuButton.prototype, 'createItems', vjs.MenuButton.prototype.createItems);
goog.exportProperty(vjs.TextTrackButton.prototype, 'createItems', vjs.TextTrackButton.prototype.createItems);
goog.exportProperty(vjs.ChaptersButton.prototype, 'createItems', vjs.ChaptersButton.prototype.createItems);

goog.exportSymbol('videojs.SubtitlesButton', vjs.SubtitlesButton);
goog.exportSymbol('videojs.CaptionsButton', vjs.CaptionsButton);
goog.exportSymbol('videojs.ChaptersButton', vjs.ChaptersButton);

goog.exportSymbol('videojs.MediaTechController', vjs.MediaTechController);
goog.exportProperty(vjs.MediaTechController.prototype, 'featuresVolumeControl', vjs.MediaTechController.prototype.featuresVolumeControl);
goog.exportProperty(vjs.MediaTechController.prototype, 'featuresFullscreenResize', vjs.MediaTechController.prototype.featuresFullscreenResize);
goog.exportProperty(vjs.MediaTechController.prototype, 'featuresPlaybackRate', vjs.MediaTechController.prototype.featuresPlaybackRate);
goog.exportProperty(vjs.MediaTechController.prototype, 'featuresProgressEvents', vjs.MediaTechController.prototype.featuresProgressEvents);
goog.exportProperty(vjs.MediaTechController.prototype, 'featuresTimeupdateEvents', vjs.MediaTechController.prototype.featuresTimeupdateEvents);
goog.exportProperty(vjs.MediaTechController.prototype, 'setPoster', vjs.MediaTechController.prototype.setPoster);


goog.exportSymbol('videojs.Html5', vjs.Html5);
goog.exportProperty(vjs.Html5, 'Events', vjs.Html5.Events);
goog.exportProperty(vjs.Html5, 'isSupported', vjs.Html5.isSupported);
goog.exportProperty(vjs.Html5, 'canPlaySource', vjs.Html5.canPlaySource);
goog.exportProperty(vjs.Html5, 'patchCanPlayType', vjs.Html5.patchCanPlayType);
goog.exportProperty(vjs.Html5, 'unpatchCanPlayType', vjs.Html5.unpatchCanPlayType);

// Export non-standard HTML5 video API methods.
// Standard method names already protected by default externs.
goog.exportProperty(vjs.Html5.prototype, 'setCurrentTime', vjs.Html5.prototype.setCurrentTime);
goog.exportProperty(vjs.Html5.prototype, 'setVolume', vjs.Html5.prototype.setVolume);
goog.exportProperty(vjs.Html5.prototype, 'setMuted', vjs.Html5.prototype.setMuted);
goog.exportProperty(vjs.Html5.prototype, 'setPreload', vjs.Html5.prototype.setPreload);
goog.exportProperty(vjs.Html5.prototype, 'setAutoplay', vjs.Html5.prototype.setAutoplay);
goog.exportProperty(vjs.Html5.prototype, 'setLoop', vjs.Html5.prototype.setLoop);
goog.exportProperty(vjs.Html5.prototype, 'enterFullScreen', vjs.Html5.prototype.enterFullScreen);
goog.exportProperty(vjs.Html5.prototype, 'exitFullScreen', vjs.Html5.prototype.exitFullScreen);
goog.exportProperty(vjs.Html5.prototype, 'playbackRate', vjs.Html5.prototype.playbackRate);
goog.exportProperty(vjs.Html5.prototype, 'setPlaybackRate', vjs.Html5.prototype.setPlaybackRate);

goog.exportSymbol('videojs.Flash', vjs.Flash);
goog.exportProperty(vjs.Flash, 'isSupported', vjs.Flash.isSupported);
goog.exportProperty(vjs.Flash, 'canPlaySource', vjs.Flash.canPlaySource);
goog.exportProperty(vjs.Flash, 'onReady', vjs.Flash['onReady']);
goog.exportProperty(vjs.Flash, 'embed', vjs.Flash.embed);
goog.exportProperty(vjs.Flash, 'version', vjs.Flash.version);

goog.exportSymbol('videojs.TextTrack', vjs.TextTrack);
goog.exportProperty(vjs.TextTrack.prototype, 'label', vjs.TextTrack.prototype.label);
goog.exportProperty(vjs.TextTrack.prototype, 'kind', vjs.TextTrack.prototype.kind);
goog.exportProperty(vjs.TextTrack.prototype, 'mode', vjs.TextTrack.prototype.mode);
goog.exportProperty(vjs.TextTrack.prototype, 'cues', vjs.TextTrack.prototype.cues);
goog.exportProperty(vjs.TextTrack.prototype, 'activeCues', vjs.TextTrack.prototype.activeCues);

goog.exportSymbol('videojs.CaptionsTrack', vjs.CaptionsTrack);
goog.exportSymbol('videojs.SubtitlesTrack', vjs.SubtitlesTrack);
goog.exportSymbol('videojs.ChaptersTrack', vjs.ChaptersTrack);

goog.exportSymbol('videojs.autoSetup', vjs.autoSetup);

goog.exportSymbol('videojs.plugin', vjs.plugin);

goog.exportSymbol('videojs.createTimeRange', vjs.createTimeRange);

goog.exportSymbol('videojs.util', vjs.util);
goog.exportProperty(vjs.util, 'mergeOptions', vjs.util.mergeOptions);
goog.exportProperty(vjs, 'addLanguage', vjs.addLanguage);
