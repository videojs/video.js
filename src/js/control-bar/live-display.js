/**
 * @file live-display.js
 */
import Component from '../component';
import * as Dom from '../utils/dom.js';

/**
 * Displays the live indicator
 * TODO - Future make it click to snap to live
 * 
 * @extends Component
 * @class LiveDisplay
 */
class LiveDisplay extends Component {

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    var el = super.createEl('div', {
      className: 'vjs-live-control vjs-control'
    });

    this.contentEl_ = Dom.createEl('div', {
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
