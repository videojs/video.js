(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _globalWindow = require('global/window');

var _globalWindow2 = _interopRequireDefault(_globalWindow);

var $ = _globalWindow2['default'].jQuery;

// var player, overlay, templateEl, $overlay;

// player = videojs('preview-player');

// overlay = document.createElement('div');
// overlay.className = 'videojs-hero-overlay transparent';
// templateEl = document.querySelector('#overlay-template');
// overlay.innerHTML = templateEl.innerHTML;
// player.el().appendChild(overlay);

// $overlay = $(overlay);

// setTimeout(function () {
//   $overlay.removeClass('transparent');
// }, 250);

// player.on('play', function () {
//   $overlay.addClass('transparent');
// });

// player.on('pause', function () {
//   $overlay.removeClass('transparent');
// });

},{"global/window":2}],2:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);

