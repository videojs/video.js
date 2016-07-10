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

      let modes = {'captions': 1, 'subtitles': 1};
      let trackList = this.player_.textTracks();
      let firstDesc;
      let firstCaptions;

      if (trackList) {
        for (let i = 0; i < trackList.length; i++) {
          let track = trackList[i];
          if (track.default) {
            if (track.kind === 'descriptions' && !firstDesc) {
              firstDesc = track;
            } else if (track.kind in modes && !firstCaptions) {
              firstCaptions = track;
            }
          }
        }

        // We want to show the first default track but captions and subtitles
        // take precedence over descriptions.
        // So, display the first default captions or subtitles track
        // and otherwise the first default descriptions track.
        if (firstCaptions) {
          firstCaptions.mode = 'showing';
        } else if (firstDesc) {
          firstDesc.mode = 'showing';
        }
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
    }, {
      'aria-live': 'assertive',
      'aria-atomic': 'true'
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

    // Track display prioritization model: if multiple tracks are 'showing',
    //  display the first 'subtitles' or 'captions' track which is 'showing',
    //  otherwise display the first 'descriptions' track which is 'showing'

    let descriptionsTrack = null;
    let captionsSubtitlesTrack = null;

    let i = tracks.length;
    while (i--) {
      let track = tracks[i];
      if (track['mode'] === 'showing') {
        if (track['kind'] === 'descriptions') {
          descriptionsTrack = track;
        } else {
          captionsSubtitlesTrack = track;
        }
      }
    }

    if (captionsSubtitlesTrack) {
      this.updateForTrack(captionsSubtitlesTrack);
    } else if (descriptionsTrack) {
      this.updateForTrack(descriptionsTrack);
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

    window['WebVTT']['processCues'](window, cues, this.el_);

    let ttSettings = this.player_.getChild('textTrackSettings');
    if (ttSettings) {
      ttSettings.applyUserSettings(cues);
    }
  }
}

Component.registerComponent('TextTrackDisplay', TextTrackDisplay);
export default TextTrackDisplay;
