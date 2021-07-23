/**
 * @file subs-caps-menu-item.js
 */
import TextTrackMenuItem from './text-track-menu-item.js';
import Component from '../../component.js';
import document from 'global/document';
import {createEl} from '../../utils/dom.js';

/**
 * SubsCapsMenuItem has an [cc] icon to distinguish captions from subtitles
 * in the SubsCapsMenu.
 *
 * @extends TextTrackMenuItem
 */
class SubsCapsMenuItem extends TextTrackMenuItem {

  createEl(type, props, attrs) {
    const el = super.createEl(type, props, attrs);

    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }

    const parentSpan = createEl('span', {
      className: 'vjs-menu-item-text'
    });

    parentSpan.appendChild(document.createTextNode(this.localize(this.options_.label)));

    if (this.options_.track.kind === 'captions') {
      parentSpan.appendChild(createEl('span', {
        className: 'vjs-icon-placeholder'
      }, {
        'aria-hidden': true
      }));
      parentSpan.appendChild(createEl('span', {
        className: 'vjs-control-text',
        // space added as the text will visually flow with the
        // label
        textContent: ` ${this.localize('Captions')}`
      }));
    }

    el.appendChild(parentSpan);

    return el;
  }
}

Component.registerComponent('SubsCapsMenuItem', SubsCapsMenuItem);
export default SubsCapsMenuItem;
