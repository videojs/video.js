/**
 * @file fullscreen-api.js
 */
import document from 'global/document';

/*
 * Store the browser-specific methods for the fullscreen API
 * @type {Object|undefined}
 * @private
 */
let FullscreenApi = {};

// browser API methods
// map approach from Screenful.js - https://github.com/sindresorhus/screenfull.js
const apiMap = [
  // Spec: https://dvcs.w3.org/hg/fullscreen/raw-file/tip/Overview.html
  [
    'requestFullscreen',
    'exitFullscreen',
    'fullscreenElement',
    'fullscreenEnabled',
    'fullscreenchange',
    'fullscreenerror'
  ],
  // WebKit
  [
    'webkitRequestFullscreen',
    'webkitExitFullscreen',
    'webkitFullscreenElement',
    'webkitFullscreenEnabled',
    'webkitfullscreenchange',
    'webkitfullscreenerror'
  ],
  // Old WebKit (Safari 5.1)
  [
    'webkitRequestFullScreen',
    'webkitCancelFullScreen',
    'webkitCurrentFullScreenElement',
    'webkitCancelFullScreen',
    'webkitfullscreenchange',
    'webkitfullscreenerror'
  ],
  // Mozilla
  [
    'mozRequestFullScreen',
    'mozCancelFullScreen',
    'mozFullScreenElement',
    'mozFullScreenEnabled',
    'mozfullscreenchange',
    'mozfullscreenerror'
  ],
  // Microsoft
  [
    'msRequestFullscreen',
    'msExitFullscreen',
    'msFullscreenElement',
    'msFullscreenEnabled',
    'MSFullscreenChange',
    'MSFullscreenError'
  ]
];

let specApi = apiMap[0];
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
  for (let i=0; i<browserApi.length; i++) {
    FullscreenApi[specApi[i]] = browserApi[i];
  }
}

export default FullscreenApi;
