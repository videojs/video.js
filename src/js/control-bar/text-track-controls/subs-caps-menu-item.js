/**
 * @file subs-caps-menu-item.js
 */
import TextTrackMenuItem from './text-track-menu-item.js';
import Component from '../../component.js';

/**
 * SubsCapsMenuItem has an [cc] icon to distinguish captions from subtitles
 * in the SubsCapsMenu.
 *
 * @extends TextTrackMenuItem
 */
class SubsCapsMenuItem extends TextTrackMenuItem {

  createEl(type, props, attrs) {
    const el = super.createEl(type, props, attrs);
    const parentSpan = super.createEl('span', {
      className: 'vjs-menu-item-text',
      textContent: this.localize(this.options_.label)
    });

    if (this.options_.track.kind === 'main-desc') {
      const icon = super.createEl('span', {
        className: 'vjs-icon-placeholder'
      }, {
        'aria-hidden': true
      });
      const controlText = super.createEl('span', {
        className: 'vjs-control-text',
        textContent: this.localize('captions')
      });

      parentSpan.appendChild(icon);
      parentSpan.appendChild(controlText);
    }

    el.appendChild(parentSpan);

    return el;
  }
}

Component.registerComponent('SubsCapsMenuItem', SubsCapsMenuItem);
export default SubsCapsMenuItem;
