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
    this.on(player, 'ended', this.handleEnded);
    this.on(player, 'seeked', this.handleSeeked);
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
   * Remove all state class and change new one if need
   *
   * @method changeStateClass
   */
  changeStateClass(stateClass) {
    if (this.hasClass(stateClass)) {
      return;
    }
    this.removeClass('vjs-playing');
    this.removeClass('vjs-paused');
    this.removeClass('vjs-ended');
    this.addClass(stateClass);
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
    this.changeStateClass('vjs-playing');
    this.controlText('Pause'); // change the button text to "Pause"
  }

  /**
   * Add the vjs-paused class to the element so it can change appearance
   *
   * @method handlePause
   */
  handlePause() {
    this.changeStateClass('vjs-paused');
    this.controlText('Play'); // change the button text to "Play"
  }

  /**
   * Add the vjs-ended class to the element so it can change appearance
   *
   * @method handleEnded
   */
  handleEnded() {
    this.changeStateClass('vjs-ended');
    this.controlText('Replay'); // change the button text to "Replay"
  }

  /**
   * Handle pause state because of seek after ended
   *
   * @method handleSeeked
   */
  handleSeeked() {
    if (this.player_.paused()) {
      this.handlePause();
    }
  }
  
}

PlayToggle.prototype.controlText_ = 'Play';

Component.registerComponent('PlayToggle', PlayToggle);
export default PlayToggle;
