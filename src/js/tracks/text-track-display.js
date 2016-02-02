/**
 * @file text-track-display.js
 */
import Component from '../component';
import * as Fn from '../utils/fn.js';
import window from 'global/window';

/**
 * The component for displaying text track cues
 *
 * @param {Object} player  Main Player
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready    Ready callback function
 * @extends Component
 * @class TextTrackDisplay
 */
class TextTrackDisplay extends Component {

  constructor(player, options, ready){
    super(player, options, ready);

    player.on('loadstart', Fn.bind(this, this.toggleDisplay));
    player.on('texttrackchange', Fn.bind(this, this.updateDisplay));

    // This used to be called during player init, but was causing an error
    // if a track should show by default and the display hadn't loaded yet.
    // Should probably be moved to an external track loader when we support
    // tracks that don't need a display.
    player.ready(Fn.bind(this, function() {
      if (player.tech_ && player.tech_['featuresNativeTextTracks']) {
        this.hide();
        return;
      }

      player.on('fullscreenchange', Fn.bind(this, this.updateDisplay));

      let tracks = this.options_.playerOptions['tracks'] || [];
      for (let i = 0; i < tracks.length; i++) {
        let track = tracks[i];
        this.player_.addRemoteTextTrack(track);
      }
    }));
  }

  /**
   * Toggle display texttracks
   *
   * @method toggleDisplay
   */
  toggleDisplay() {
    if (this.player_.tech_ && this.player_.tech_['featuresNativeTextTracks']) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-text-track-display'
    });
  }

  /**
   * Clear display texttracks
   *
   * @method clearDisplay
   */
  clearDisplay() {
    if (typeof window['WebVTT'] === 'function') {
      window['WebVTT']['processCues'](window, [], this.el_);
    }
  }

  /**
   * Update display texttracks
   *
   * @method updateDisplay
   */
  updateDisplay() {
    var tracks = this.player_.textTracks();

    this.clearDisplay();

    if (!tracks) {
      return;
    }

    for (let i=0; i < tracks.length; i++) {
      let track = tracks[i];
      if (track['mode'] === 'showing') {
        this.updateForTrack(track);
      }
    }
  }

  /**
   * Add texttrack to texttrack list
   *
   * @param {TextTrackObject} track Texttrack object to be added to list
   * @method updateForTrack
   */
  updateForTrack(track) {
    if (typeof window['WebVTT'] !== 'function' || !track['activeCues']) {
      return;
    }

    let cues = [];
    for (let i = 0; i < track['activeCues'].length; i++) {
      cues.push(track['activeCues'][i]);
    }

    window['WebVTT']['processCues'](window, track['activeCues'], this.el_);

    let ttSettings = this.player_.getChild('textTrackSettings');
    if (ttSettings) {
      ttSettings.applyUserSettings(cues);
    }
  }
}

Component.registerComponent('TextTrackDisplay', TextTrackDisplay);
export default TextTrackDisplay;
