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

    this.descriptionEl = Dom.createEl('div', {
      className: 'vjs-title-bar-description',
      id: `vjs-title-bar-description-${Guid.newGUID()}`
    });

    return Dom.createEl('div', {
      className: 'vjs-title-bar'
    }, {}, [
      this.titleEl,
      this.descriptionEl
    ]);
  }

  /**
   * Update the contents of the title bar with new title and description text.
   *
   * If both title and description are missing, the title bar will be hidden.
   *
   * If either title or description are present, the title bar will be visible.
   *
   * @param  {Object} [options={}]
   *         An options object. When empty, the title bar will be hidden.
   *
   * @param  {string} [options.title]
   *         A title to display in the title bar.
   *
   * @param  {string} [options.description]
   *         A description to display in the title bar.
   */
  update({title = '', description = ''} = {}) {
    const {titleEl, descriptionEl} = this;
    const tech = this.player_.tech_;
    const techEl = tech && tech.el_;

    Dom.emptyEl(titleEl);
    Dom.emptyEl(descriptionEl);

    // If there is a tech element available, update its ARIA attributes
    // according to whether a title and/or description have been provided.
    if (techEl) {
      techEl.removeAttribute('aria-labelledby');
      techEl.removeAttribute('aria-describedby');

      if (title) {
        techEl.setAttribute('aria-labelledby', titleEl.id);
      }
      if (description) {
        techEl.setAttribute('aria-describedby', descriptionEl.id);
      }
    }

    Dom.textContent(titleEl, title);
    Dom.textContent(descriptionEl, description);

    if (title || description) {
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
    this.descriptionEl = null;
  }
}

Component.registerComponent('TitleBar', TitleBar);

export default TitleBar;
