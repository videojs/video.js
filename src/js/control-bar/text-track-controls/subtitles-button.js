/**
 * @file subtitles-button.js
 */
import TextTrackButton from './text-track-button.js';
import Component from '../../component.js';

/**
 * The button component for toggling and selecting subtitles
 *
 * @param {Object} player  Player object
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready    Ready callback function
 * @extends TextTrackButton
 * @class SubtitlesButton
 */
class SubtitlesButton extends TextTrackButton {

  constructor(player, options, ready){
    super(player, options, ready);
    this.el_.setAttribute('aria-label','Subtitles Menu');
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    return `vjs-subtitles-button ${super.buildCSSClass()}`;
  }

}

SubtitlesButton.prototype.kind_ = 'subtitles';
SubtitlesButton.prototype.controlText_ = 'Subtitles';

Component.registerComponent('SubtitlesButton', SubtitlesButton);
export default SubtitlesButton;
