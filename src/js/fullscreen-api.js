(function(){
  var apiMap, specApi, browserApi, i;

  /**
   * Store the browser-specifc methods for the fullscreen API
   * @type {Object|undefined}
   * @private
   */
  vjs.browser.fullscreenAPI;

  // browser API methods
  // map approach from Screenful.js - https://github.com/sindresorhus/screenfull.js
  apiMap = [
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

  specApi = apiMap[0];

  // determine the supported set of functions
  for (i=0; i<apiMap.length; i++) {
    // check for exitFullscreen function
    if (apiMap[i][1] in document) {
      browserApi = apiMap[i];
      break;
    }
  }

  // map the browser API names to the spec API names
  // or leave vjs.browser.fullscreenAPI undefined
  if (browserApi) {
    vjs.browser.fullscreenAPI = {};

    for (i=0; i<browserApi.length; i++) {
      vjs.browser.fullscreenAPI[specApi[i]] = browserApi[i];
    }
  }

})();
