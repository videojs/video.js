/**
 * @file subs-caps-menu-item.js
 */
import TextTrackMenuItem from './text-track-menu-item.js';
import Component from '../../component.js';
import {assign} from '../../utils/obj';

/**
 * SubsCapsMenuItem has an [cc] icon to distinguish captions from subtitles
 * in the SubsCapsMenu.
 *
 * @extends TextTrackMenuItem
 */
class SubsCapsMenuItem extends TextTrackMenuItem {

  createEl(type, props, attrs) {
    let innerHTML = `<span class="vjs-menu-item-text">${this.localize(this.options_.label)}`;

    if (this.options_.track.kind === 'captions') {
      innerHTML += `
        <span aria-hidden="true" class="vjs-icon-placeholder"></span>
        <span class="vjs-control-text"> ${this.localize('Captions')}</span>
      `;
    }

    innerHTML += '</span>';

    const el = super.createEl(type, assign({
      innerHTML
    }, props), attrs);

    return el;
  }
}

Component.registerComponent('SubsCapsMenuItem', SubsCapsMenuItem);
export default SubsCapsMenuItem;
