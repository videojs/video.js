/**
 * @fileoverview Externs for videojs.Player. Externs are functions that the
 * compiler shouldn't obfuscate.
 */

/**
 * Fullscreen functionality
 */
videojs.Player.prototype.isFullScreen = undefined;
videojs.Player.prototype.requestFullScreen = function(){};
videojs.Player.prototype.cancelFullScreen = function(){};

/**
 * Text tracks
 */
videojs.Player.prototype.textTracks = function(){};
