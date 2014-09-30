/**
 * @fileoverview Externs for videojs.Player. Externs are functions that the
 * compiler shouldn't obfuscate.
 */

/**
 * @constructor
 * @extends {videojs.Component}
 */
 videojs.Player = function(){};

/**
 * Native HTML5 video properties
 * Most likely covered by the default closure compiler externs
 * Copied list from http://code.google.com/p/closure-compiler/source/browse/externs/html5.js?spec=svne2e531de906d9ccccf23516bd2dd6152a93f6468&r=e2e531de906d9ccccf23516bd2dd6152a93f6468
 * May not all be available on a videojs player yet
 */
videojs.Player.prototype.error = function(){};
videojs.Player.prototype.src = function(){};
videojs.Player.prototype.currentSrc = function(){};
videojs.Player.prototype.networkState = function(){};
videojs.Player.prototype.buffered = function(){};
videojs.Player.prototype.load = function(){};
videojs.Player.prototype.canPlayType = function(){};
videojs.Player.prototype.readyState = function(){};
videojs.Player.prototype.seeking = function(){};
videojs.Player.prototype.currentTime = function(){};
videojs.Player.prototype.remainingTime = function(){};
videojs.Player.prototype.startTime = function(){};
videojs.Player.prototype.duration = function(){};
videojs.Player.prototype.paused = function(){};
videojs.Player.prototype.defaultPlaybackRate = function(){};
videojs.Player.prototype.playbackRate = function(){};
videojs.Player.prototype.played = function(){};
videojs.Player.prototype.seekable = function(){};
videojs.Player.prototype.ended = function(){};
videojs.Player.prototype.autoplay = function(){};
videojs.Player.prototype.loop = function(){};
videojs.Player.prototype.play = function() {};
videojs.Player.prototype.pause = function() {};
videojs.Player.prototype.controls = function(){};
videojs.Player.prototype.volume = function(){};
videojs.Player.prototype.muted = function(){};
videojs.Player.prototype.width = function(){};
videojs.Player.prototype.height = function(){};
videojs.Player.prototype.videoWidth = function(){};
videojs.Player.prototype.videoHeight = function(){};
videojs.Player.prototype.poster = function(){};

/**
 * Fullscreen functionality
 */
videojs.Player.prototype.isFullscreen = function(){};
videojs.Player.prototype.isFullScreen = function(){}; /* deprecated */
videojs.Player.prototype.requestFullscreen = function(){};
videojs.Player.prototype.requestFullScreen = function(){}; /* deprecated */
videojs.Player.prototype.exitFullscreen = function(){};
videojs.Player.prototype.cancelFullScreen = function(){}; /* deprecated */

/**
 * Text tracks
 */
videojs.Player.prototype.textTracks = function(){};

/**
 * Language support
 */
videojs.Player.prototype.language = function(){};
videojs.Player.prototype.languages = function(){};

/**
 * Component functions
 */
videojs.Player.prototype.dispose = function(){};

/**
 * Buffered percent
 */
videojs.Player.prototype.bufferedPercent = function(){};

/**
 * User activity functions
 */
videojs.Player.prototype.reportUserActivity = function(){};
videojs.Player.prototype.userActive = function(){};

/**
 * Native controls
 */
videojs.Player.prototype.usingNativeControls = function(){};

/**
 * Source selection
 */
videojs.Player.prototype.selectSource = function(){};
