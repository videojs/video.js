import TextTrackButton from './text-track-button.js';
import Component from '../../component.js';

/**
 * The button component for toggling and selecting subtitles
 *
 * @constructor
 */
class SubtitlesButton extends TextTrackButton {

  constructor(player, options, ready){
    super(player, options, ready);
    this.el_.setAttribute('aria-label','Subtitles Menu');
  }

  buildCSSClass() {
    return `vjs-subtitles-button ${super.buildCSSClass()}`;
  }

}

SubtitlesButton.prototype.kind_ = 'subtitles';
SubtitlesButton.prototype.controlText_ = 'Subtitles';

Component.registerComponent('SubtitlesButton', SubtitlesButton);
export default SubtitlesButton;
