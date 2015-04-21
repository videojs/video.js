import Component from '../../component.js';

/**
 * Shows play progress
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */
class PlayProgressBar extends Component {

  createEl() {
    return super.createEl('div', {
      className: 'vjs-play-progress',
      innerHTML: `<span class="vjs-control-text"><span>${this.localize('Progress')}</span>: 0%</span>`
    });
  }

}

Component.registerComponent('PlayProgressBar', PlayProgressBar);
export default PlayProgressBar;
