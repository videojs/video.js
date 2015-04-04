import Component from '../component';
import * as Lib from '../lib';

import PlayToggle from './play-toggle';
import CurrentTimeDisplay from './time-display';
import LiveDisplay from './live-display';
import ProgressControl from './progress-control';
import FullscreenToggle from './fullscreen-toggle';
import VolumeControl from './volume-control';
import VolumeMenuButton from './volume-menu-button';
import MuteToggle from './mute-toggle';
import PlaybackRateMenuButton from './playback-rate-menu-button';

/**
 * Container of main controls
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 * @extends vjs.Component
 */
var ControlBar = Component.extend();

Component.registerComponent('ControlBar', ControlBar);

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
    'playbackRateMenuButton': {},
    'subtitlesButton': {},
    'captionsButton': {},
    'chaptersButton': {}
  }
};

ControlBar.prototype.createEl = function(){
  return Lib.createEl('div', {
    className: 'vjs-control-bar'
  });
};
