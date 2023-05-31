/**
 * @file control-bar.js
 */
import Component from '../component.js';

// Required children
import './play-toggle.js';
import './time-controls/current-time-display.js';
import './time-controls/duration-display.js';
import './time-controls/time-divider.js';
import './time-controls/remaining-time-display.js';
import './live-display.js';
import './seek-to-live.js';
import './progress-control/progress-control.js';
import './picture-in-picture-toggle.js';
import './fullscreen-toggle.js';
import './volume-panel.js';
import './skip-buttons/skip-forward.js';
import './skip-buttons/skip-backward.js';
import './text-track-controls/chapters-button.js';
import './text-track-controls/descriptions-button.js';
import './text-track-controls/subtitles-button.js';
import './text-track-controls/captions-button.js';
import './text-track-controls/subs-caps-button.js';
import './audio-track-controls/audio-track-button.js';
import './playback-rate-menu/playback-rate-menu-button.js';
import './spacer-controls/custom-control-spacer.js';

/**
 * Container of main controls.
 *
 * @extends Component
 */
class ControlBar extends Component {

  /**
   * Create the `Component`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-control-bar',
      dir: 'ltr'
    });
  }
}

/**
 * Default options for `ControlBar`
 *
 * @type {Object}
 * @private
 */
ControlBar.prototype.options_ = {
  children: [
    'playToggle',
    'skipBackward',
    'skipForward',
    'volumePanel',
    'currentTimeDisplay',
    'timeDivider',
    'durationDisplay',
    'progressControl',
    'liveDisplay',
    'seekToLive',
    'remainingTimeDisplay',
    'customControlSpacer',
    'playbackRateMenuButton',
    'chaptersButton',
    'descriptionsButton',
    'subsCapsButton',
    'audioTrackButton',
    'pictureInPictureToggle',
    'fullscreenToggle'
  ]
};

Component.registerComponent('ControlBar', ControlBar);
export default ControlBar;
