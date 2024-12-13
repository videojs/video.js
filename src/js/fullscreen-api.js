/**
 * @file fullscreen-api.js
 * @module fullscreen-api
 */
import document from 'global/document';

/**
 * Store the browser-specific methods for the fullscreen API.
 *
 * @type {Object}
 * @property {string} requestFullscreen
 * @property {string} exitFullscreen
 * @property {string} fullscreenElement
 * @property {string} fullscreenEnabled
 * @property {string} fullscreenchange
 * @property {string} fullscreenerror
 * @property {string} fullscreen
 * @property {boolean} prefixed
 * @see [Specification]{@link https://fullscreen.spec.whatwg.org}
 * @see [Map Approach From Screenfull.js]{@link https://github.com/sindresorhus/screenfull.js}
 */
const FullscreenApi = {
  prefixed: true
};

// browser API methods
const apiMap = [
  [
    'requestFullscreen',
    'exitFullscreen',
    'fullscreenElement',
    'fullscreenEnabled',
    'fullscreenchange',
    'fullscreenerror',
    'fullscreen'
  ],
  // WebKit
  [
    'webkitRequestFullscreen',
    'webkitExitFullscreen',
    'webkitFullscreenElement',
    'webkitFullscreenEnabled',
    'webkitfullscreenchange',
    'webkitfullscreenerror',
    '-webkit-full-screen'
  ]
];

const specApi = apiMap[0];
let browserApi;

// determine the supported set of functions
for (let i = 0; i < apiMap.length; i++) {
  // check for exitFullscreen function
  if (apiMap[i][1] in document) {
    browserApi = apiMap[i];
    break;
  }
}

// map the browser API names to the spec API names
if (browserApi) {
  for (let i = 0; i < browserApi.length; i++) {
    FullscreenApi[specApi[i]] = browserApi[i];
  }

  FullscreenApi.prefixed = browserApi[0] !== specApi[0];
}

export default FullscreenApi;
