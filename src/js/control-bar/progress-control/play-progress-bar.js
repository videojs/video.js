/**
* @file play-progress-bar.js
*/
import Component from '../../component.js';

/**
* Shows play progress
*
* @param {Player|Object} player
* @param {Object=} options
* @extends Component
* @class PlayProgressBar
*/
class PlayProgressBar extends Component {

  /**
  * Create the component's DOM element
  *
  * @return {Element}
  * @method createEl
  */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-play-progress',
      innerHTML: `<span class="vjs-control-text"><span>${this.localize('Progress')}</span>: 0%</span>`
    });
  }

}

Component.registerComponent('PlayProgressBar', PlayProgressBar);
export default PlayProgressBar;
