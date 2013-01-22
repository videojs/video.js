/**
 * @fileoverview Externs for video-js.swf. Externs are functions
 * that the compiler shouldn't obfuscate.
 */

/**
 * @param {string} name
 */
HTMLObjectElement.prototype.vjs_getProperty = function(name) {};

/**
 * @param {string} name
 * @param {string|number} value
 */
HTMLObjectElement.prototype.vjs_setProperty = function(name, value) {};

/**
 * Control methods
 */
HTMLObjectElement.prototype.vjs_play = function() {};
HTMLObjectElement.prototype.vjs_pause = function() {};
HTMLObjectElement.prototype.vjs_load = function() {};

/**
 * @param {string} src
 */
HTMLObjectElement.prototype.vjs_src = function(src) {};
