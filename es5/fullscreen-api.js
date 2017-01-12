'use strict';

exports.__esModule = true;

var _document = require('global/document');

var _document2 = _interopRequireDefault(_document);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/**
 * Store the browser-specific methods for the fullscreen API.
 *
 * @type {Object}
 * @see [Specification]{@link https://fullscreen.spec.whatwg.org}
 * @see [Map Approach From Screenfull.js]{@link https://github.com/sindresorhus/screenfull.js}
 */
var FullscreenApi = {};

// browser API methods
/**
 * @file fullscreen-api.js
 * @module fullscreen-api
 * @private
 */
var apiMap = [['requestFullscreen', 'exitFullscreen', 'fullscreenElement', 'fullscreenEnabled', 'fullscreenchange', 'fullscreenerror'],
// WebKit
['webkitRequestFullscreen', 'webkitExitFullscreen', 'webkitFullscreenElement', 'webkitFullscreenEnabled', 'webkitfullscreenchange', 'webkitfullscreenerror'],
// Old WebKit (Safari 5.1)
['webkitRequestFullScreen', 'webkitCancelFullScreen', 'webkitCurrentFullScreenElement', 'webkitCancelFullScreen', 'webkitfullscreenchange', 'webkitfullscreenerror'],
// Mozilla
['mozRequestFullScreen', 'mozCancelFullScreen', 'mozFullScreenElement', 'mozFullScreenEnabled', 'mozfullscreenchange', 'mozfullscreenerror'],
// Microsoft
['msRequestFullscreen', 'msExitFullscreen', 'msFullscreenElement', 'msFullscreenEnabled', 'MSFullscreenChange', 'MSFullscreenError']];

var specApi = apiMap[0];
var browserApi = void 0;

// determine the supported set of functions
for (var i = 0; i < apiMap.length; i++) {
  // check for exitFullscreen function
  if (apiMap[i][1] in _document2['default']) {
    browserApi = apiMap[i];
    break;
  }
}

// map the browser API names to the spec API names
if (browserApi) {
  for (var _i = 0; _i < browserApi.length; _i++) {
    FullscreenApi[specApi[_i]] = browserApi[_i];
  }
}

exports['default'] = FullscreenApi;
