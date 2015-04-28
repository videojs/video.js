import Component from '../component';
import * as Lib from '../lib';

/**
 * Displays the live indicator
 * TODO - Future make it click to snap to live
 * @param {Player|Object} player
 * @param {Object=} options
 * @constructor
 */
class LiveDisplay extends Component {

  createEl() {
    var el = super.createEl('div', {
      className: 'vjs-live-controls vjs-control'
    });

    this.contentEl_ = Lib.createEl('div', {
      className: 'vjs-live-display',
      innerHTML: `<span class="vjs-control-text">${this.localize('Stream Type')}</span>${this.localize('LIVE')}`,
      'aria-live': 'off'
    });

    el.appendChild(this.contentEl_);

    return el;
  }

}

Component.registerComponent('LiveDisplay', LiveDisplay);
export default LiveDisplay;
