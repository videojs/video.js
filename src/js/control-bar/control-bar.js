var ControlBar, Component, vjslib;

Component = require('../component.js');
vjslib = require('../lib.js');

/**
 * Container of main controls
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 * @extends vjs.Component
 */
ControlBar = Component.extend();

ControlBar.prototype.options_ = {
  loadEvent: 'play',
  children: {
    'playToggle': {},
    'currentTimeDisplay': {},
    'timeDivider': {},
    'durationDisplay': {},
    'remainingTimeDisplay': {},
    'liveDisplay': {},
    'progressControl': {},
    'fullscreenToggle': {},
    'volumeControl': {},
    'muteToggle': {},
    // 'volumeMenuButton': {},
    'playbackRateMenuButton': {}
  }
};

ControlBar.prototype.createEl = function(){
  return vjslib.createEl('div', {
    className: 'vjs-control-bar'
  });
};

module.exports = ControlBar;
