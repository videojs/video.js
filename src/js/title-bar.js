import Component from './component';
import * as Dom from './utils/dom';
import * as Guid from './utils/guid';

/**
 * Displays an element over the player which contains an optional title and
 * description for the current content.
 *
 * Much of the code for this component originated in the now obsolete
 * videojs-dock plugin: https://github.com/brightcove/videojs-dock/
 *
 * @extends Component
 */
class TitleBar extends Component {

  constructor(player, options) {
    super(player, options);

    this.update = this.update.bind(this);
    this.update(options);
  }

  /**
   * Create the `TitleBar`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    this.titleEl = Dom.createEl('div', {
      className: 'vjs-title-bar-title',
      id: `vjs-title-bar-title-${Guid.newGUID()}`
    });

    this.descEl = Dom.createEl('div', {
      className: 'vjs-title-bar-desc',
      id: `vjs-title-bar-desc-${Guid.newGUID()}`
    });

    return Dom.createEl('div', {
      className: 'vjs-title-bar'
    }, {}, [
      this.titleEl,
      this.descEl
    ]);
  }

  /**
   * Update the contents of the title bar with new title and description text.
   *
   * @param  {Object} [options]
   * @param  {string} [options.title]
   * @param  {string} [options.desc]
   */
  update({title = '', desc = ''} = {}) {
    const {titleEl, descEl} = this;
    const tech = this.player_.tech_;
    const techEl = tech && tech.el_;

    Dom.emptyEl(titleEl);
    Dom.emptyEl(descEl);

    // If there is a tech element available, update its ARIA attributes
    // according to whether a title and/or description have been provided.
    if (techEl) {
      techEl.removeAttribute('aria-labelledby');
      techEl.removeAttribute('aria-describedby');

      if (title) {
        techEl.setAttribute('aria-labelledby', titleEl.id);
      }
      if (desc) {
        techEl.setAttribute('aria-describedby', descEl.id);
      }
    }

    Dom.textContent(titleEl, title);
    Dom.textContent(descEl, desc);

    if (title || desc) {
      this.show();
    } else {
      this.hide();
    }
  }

  dispose() {
    const tech = this.player_.tech_;
    const techEl = tech && tech.el_;

    if (techEl) {
      techEl.removeAttribute('aria-labelledby');
      techEl.removeAttribute('aria-describedby');
    }

    super.dispose();
    this.titleEl = null;
    this.descEl = null;
  }
}

Component.registerComponent('TitleBar', TitleBar);

export default TitleBar;
