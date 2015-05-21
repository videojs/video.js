import Button from './button.js';
import Component from './component.js';

/* Big Play Button
================================================================================ */
/**
 * Initial play button. Shows before the video has played. The hiding of the
 * big play button is done via CSS and player states.
 * @param {Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
class BigPlayButton extends Button {

  createEl() {
    return super.createEl('div', {
      className: 'vjs-big-play-button',
      innerHTML: '<span aria-hidden="true"></span>',
      'aria-label': 'play video'
    });
  }

  handleClick() {
    this.player_.play();
  }

}

Component.registerComponent('BigPlayButton', BigPlayButton);
export default BigPlayButton;
