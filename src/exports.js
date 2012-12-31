goog.require('_V_');
goog.require('_V_.Component');
goog.require('_V_.Player');

goog.exportSymbol('VideoJS', VideoJS);

goog.exportSymbol('_V_.Component', _V_.Component);
goog.exportProperty(_V_.Component.prototype, "dispose", _V_.Component.prototype.dispose);
goog.exportProperty(_V_.Component.prototype, "createEl", _V_.Component.prototype.createEl);
goog.exportProperty(_V_.Component.prototype, "getEl", _V_.Component.prototype.getEl);
goog.exportProperty(_V_.Component.prototype, "addChild", _V_.Component.prototype.addChild);
goog.exportProperty(_V_.Component.prototype, "getChildren", _V_.Component.prototype.getChildren);
goog.exportProperty(_V_.Component.prototype, "on", _V_.Component.prototype.on);
goog.exportProperty(_V_.Component.prototype, "off", _V_.Component.prototype.off);
goog.exportProperty(_V_.Component.prototype, "one", _V_.Component.prototype.one);
goog.exportProperty(_V_.Component.prototype, "trigger", _V_.Component.prototype.trigger);
goog.exportProperty(_V_.Component.prototype, "show", _V_.Component.prototype.show);
goog.exportProperty(_V_.Component.prototype, "hide", _V_.Component.prototype.hide);
goog.exportProperty(_V_.Component.prototype, "width", _V_.Component.prototype.width);
goog.exportProperty(_V_.Component.prototype, "height", _V_.Component.prototype.height);
goog.exportProperty(_V_.Component.prototype, "dimensions", _V_.Component.prototype.dimensions);

goog.exportSymbol('_V_.Player', _V_.Player);

goog.exportSymbol('_V_.MediaLoader', _V_.MediaLoader);
goog.exportSymbol('_V_.PosterImage', _V_.PosterImage);
goog.exportSymbol('_V_.LoadingSpinner', _V_.LoadingSpinner);
goog.exportSymbol('_V_.BigPlayButton', _V_.BigPlayButton);
goog.exportSymbol('_V_.ControlBar', _V_.ControlBar);
goog.exportSymbol('_V_.TextTrackDisplay', _V_.TextTrackDisplay);

goog.exportSymbol('_V_.Control', _V_.Control);
goog.exportSymbol('_V_.ControlBar', _V_.ControlBar);
goog.exportSymbol('_V_.Button', _V_.Button);
goog.exportSymbol('_V_.PlayButton', _V_.PlayButton);
goog.exportSymbol('_V_.PauseButton', _V_.PauseButton);
goog.exportSymbol('_V_.PlayToggle', _V_.PlayToggle);
goog.exportSymbol('_V_.FullscreenToggle', _V_.FullscreenToggle);
goog.exportSymbol('_V_.BigPlayButton', _V_.BigPlayButton);
goog.exportSymbol('_V_.LoadingSpinner', _V_.LoadingSpinner);
goog.exportSymbol('_V_.CurrentTimeDisplay', _V_.CurrentTimeDisplay);
goog.exportSymbol('_V_.DurationDisplay', _V_.DurationDisplay);
goog.exportSymbol('_V_.TimeDivider', _V_.TimeDivider);
goog.exportSymbol('_V_.RemainingTimeDisplay', _V_.RemainingTimeDisplay);
goog.exportSymbol('_V_.Slider', _V_.Slider);
goog.exportSymbol('_V_.ProgressControl', _V_.ProgressControl);
goog.exportSymbol('_V_.SeekBar', _V_.SeekBar);
goog.exportSymbol('_V_.LoadProgressBar', _V_.LoadProgressBar);
goog.exportSymbol('_V_.PlayProgressBar', _V_.PlayProgressBar);
goog.exportSymbol('_V_.SeekHandle', _V_.SeekHandle);
goog.exportSymbol('_V_.VolumeControl', _V_.VolumeControl);
goog.exportSymbol('_V_.VolumeBar', _V_.VolumeBar);
goog.exportSymbol('_V_.VolumeLevel', _V_.VolumeLevel);
goog.exportSymbol('_V_.VolumeHandle', _V_.VolumeHandle);
goog.exportSymbol('_V_.MuteToggle', _V_.MuteToggle);
goog.exportSymbol('_V_.PosterImage', _V_.PosterImage);
goog.exportSymbol('_V_.Menu', _V_.Menu);
goog.exportSymbol('_V_.MenuItem', _V_.MenuItem);

goog.exportSymbol('_V_.MediaTechController', _V_.MediaTechController);

goog.exportSymbol('_V_.Html5', _V_.Html5);
goog.exportProperty(_V_.Html5, "Supports", _V_.Html5.Supports);
goog.exportProperty(_V_.Html5, "Events", _V_.Html5.Events);
goog.exportProperty(_V_.Html5, "isSupported", _V_.Html5.isSupported);
goog.exportProperty(_V_.Html5, "canPlaySource", _V_.Html5.canPlaySource);

// Export non-standard HTML5 video API methods.
// Standard method names already protected by default externs.
goog.exportProperty(_V_.Html5.prototype, "setCurrentTime", _V_.Html5.prototype.setCurrentTime);
goog.exportProperty(_V_.Html5.prototype, "setVolume", _V_.Html5.prototype.setVolume);
goog.exportProperty(_V_.Html5.prototype, "setMuted", _V_.Html5.prototype.setMuted);
goog.exportProperty(_V_.Html5.prototype, "setPreload", _V_.Html5.prototype.setPreload);
goog.exportProperty(_V_.Html5.prototype, "setAutoplay", _V_.Html5.prototype.setAutoplay);
goog.exportProperty(_V_.Html5.prototype, "setLoop", _V_.Html5.prototype.setLoop);


// Allow external components to use global cache
goog.exportSymbol('_V_.cache', _V_.cache);
