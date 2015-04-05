import TextTrackButton from './text-track-button.js';

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

}

SubtitlesButton.prototype.kind_ = 'subtitles';
SubtitlesButton.prototype.buttonText = 'Subtitles';
SubtitlesButton.prototype.className = 'vjs-subtitles-button';

TextTrackButton.registerComponent('SubtitlesButton', SubtitlesButton);
export default SubtitlesButton;