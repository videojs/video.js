/**
 * @file play-toggle.js
 */
import Button from '../button.js';
import Component from '../component.js';

/**
 * Button to toggle between play and pause
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @extends Button
 * @class PlayToggle
 */
class PlayToggle extends Button {

  constructor(player, options){
    super(player, options);

    this.on(player, 'play', this.handlePlay);
    this.on(player, 'pause', this.handlePause);
  }

  /**
   * Allow sub components to stack CSS class names
   *
   * @return {String} The constructed class name
   * @method buildCSSClass
   */
  buildCSSClass() {
    return `vjs-play-control ${super.buildCSSClass()}`;
  }

  /**
   * Handle click to toggle between play and pause
   *
   * @method handleClick
   */
  handleClick() {
    if (this.player_.paused()) {
      this.player_.play();
    } else {
      this.player_.pause();
    }
  }

  /**
   * Add the vjs-playing class to the element so it can change appearance
   *
   * @method handlePlay
   */
  handlePlay() {
    this.removeClass('vjs-paused');
    this.addClass('vjs-playing');
    this.controlText('Pause'); // change the button text to "Pause"
  }

  /**
   * Add the vjs-paused class to the element so it can change appearance
   *
   * @method handlePause
   */
  handlePause() {
    this.removeClass('vjs-playing');
    this.addClass('vjs-paused');
    this.controlText('Play'); // change the button text to "Play"
  }

}

PlayToggle.prototype.controlText_ = 'Play';

Component.registerComponent('PlayToggle', PlayToggle);
export default PlayToggle;
