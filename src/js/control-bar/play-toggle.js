import Button from '../button.js';
import Component from '../component.js';

/**
 * Button to toggle between play and pause
 * @param {Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
class PlayToggle extends Button {

  constructor(player, options){
    super(player, options);

    this.on(player, 'play', this.handlePlay);
    this.on(player, 'pause', this.handlePause);
  }

  buildCSSClass() {
    return `vjs-play-control ${super.buildCSSClass()}`;
  }

  // handleClick - Toggle between play and pause
  handleClick() {
    if (this.player_.paused()) {
      this.player_.play();
    } else {
      this.player_.pause();
    }
  }

  // handlePlay - Add the vjs-playing class to the element so it can change appearance
  handlePlay() {
    this.removeClass('vjs-paused');
    this.addClass('vjs-playing');
    this.el_.children[0].children[0].innerHTML = this.localize('Pause'); // change the button text to "Pause"
  }

  // handlePause - Add the vjs-paused class to the element so it can change appearance
  handlePause() {
    this.removeClass('vjs-playing');
    this.addClass('vjs-paused');
    this.el_.children[0].children[0].innerHTML = this.localize('Play'); // change the button text to "Play"
  }

}

PlayToggle.prototype.buttonText = 'Play';

Component.registerComponent('PlayToggle', PlayToggle);
export default PlayToggle;
