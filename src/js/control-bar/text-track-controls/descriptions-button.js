/**
 * @file descriptions-button.js
 */
import TextTrackButton from './text-track-button.js';
import Component from '../../component.js';
import * as Fn from '../../utils/fn.js';

/**
 * The button component for toggling and selecting descriptions
 *
 * @param {Object} player  Player object
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready    Ready callback function
 * @extends TextTrackButton
 * @class DescriptionsButton
 */
class DescriptionsButton extends TextTrackButton {

  constructor(player, options, ready){
    super(player, options, ready);
    this.el_.setAttribute('aria-label', 'Descriptions Menu');

    let tracks = player.textTracks();

    if (tracks) {
      let changeHandler = Fn.bind(this, this.handleTracksChange);

      tracks.addEventListener('change', changeHandler);
      this.on('dispose', function() {
        tracks.removeEventListener('change', changeHandler);
      });
    }
  }

  /**
   * Handle text track change
   *
   * @method handleTracksChange
   */
  handleTracksChange(event){
    let tracks = this.player().textTracks();
    let disabled = false;

    // Check whether a track of a different kind is showing
    for (let i = 0, l = tracks.length; i < l; i++) {
      let track = tracks[i];
      if (track['kind'] !== this.kind_ && track['mode'] === 'showing') {
        disabled = true;
        break;
      }
    }

    // If another track is showing, disable this menu button
    if (disabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    return `vjs-descriptions-button ${super.buildCSSClass()}`;
  }

}

DescriptionsButton.prototype.kind_ = 'descriptions';
DescriptionsButton.prototype.controlText_ = 'Descriptions';

Component.registerComponent('DescriptionsButton', DescriptionsButton);
export default DescriptionsButton;
