// Attempting to create a portable script that loads source files in order. So we can change which files are included and have it change multiple places.
var vjsSourceList = ["require",
  'order!../../src/core.js',
  'order!../../src/lib.js',
  'order!../../src/component.js',
  'order!../../src/controls.js',
  'order!../../src/ecma.js',
  'order!../../src/events.js',
  'order!../../src/json.js',
  'order!../../src/player.js',
  'order!../../src/tech.js',
  'order!../../src/tracks.js',
  'order!../../flash/swfobject.js',
  'order!../../src/setup.js'
];

// Not going to be used in production, so eval ok.
require([vjsSourceList])

// var requireEval = '';
// for (var i=0; i < vjsSourceList.length; i++) {
//   requireEval += 'require(["order!'+vjsSourceList[i]+'"], function() { ';
// }
// 
// requireEval += 'var libsLoaded = true;'
// 
// for (var i=0; i < vjsSourceList.length; i++) {
//   requireEval += ' }); ';
// }
// 
// eval(requireEval);