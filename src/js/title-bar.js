import Component from './component';
import * as Dom from './utils/dom';
import * as Guid from './utils/guid';
import * as Obj from './utils/obj';

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
    this.on('statechanged', (e) => this.updateDom_());
    this.updateDom_();
  }

  /**
   * Create the `TitleBar`'s DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    this.els = {
      title: Dom.createEl('div', {
        className: 'vjs-title-bar-title',
        id: `vjs-title-bar-title-${Guid.newGUID()}`
      }),
      description: Dom.createEl('div', {
        className: 'vjs-title-bar-description',
        id: `vjs-title-bar-description-${Guid.newGUID()}`
      })
    };

    return Dom.createEl('div', {
      className: 'vjs-title-bar'
    }, {}, Obj.values(this.els));
  }

  /**
   * Updates the DOM based on the component's state object.
   */
  updateDom_() {
    const tech = this.player_.tech_;
    const techEl = tech && tech.el_;
    const techAriaAttrs = {
      title: 'aria-labelledby',
      description: 'aria-describedby'
    };

    ['title', 'description'].forEach(k => {
      const value = this.state[k];
      const el = this.els[k];
      const techAriaAttr = techAriaAttrs[k];

      Dom.emptyEl(el);

      if (value) {
        Dom.textContent(el, value);
      }

      // If there is a tech element available, update its ARIA attributes
      // according to whether a title and/or description have been provided.
      if (techEl) {
        techEl.removeAttribute(techAriaAttr);

        if (value) {
          techEl.setAttribute(techAriaAttr, el.id);
        }
      }
    });

    if (this.state.title || this.state.description) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Update the contents of the title bar component with new title and
   * description text.
   *
   * If both title and description are missing, the title bar will be hidden.
   *
   * If either title or description are present, the title bar will be visible.
   *
   * NOTE: Any previously set value will be preserved. To unset a previously
   * set value, you must pass an empty string or null.
   *
   * For example:
   *
   * ```
   * update({title: 'foo', description: 'bar'}) // title: 'foo', description: 'bar'
   * update({description: 'bar2'}) // title: 'foo', description: 'bar2'
   * update({title: ''}) // title: '', description: 'bar2'
   * update({title: 'foo', description: null}) // title: 'foo', description: null
   * ```
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
  update(options) {
    this.setState(options);
  }

  /**
   * Dispose the component.
   */
  dispose() {
    const tech = this.player_.tech_;
    const techEl = tech && tech.el_;

    if (techEl) {
      techEl.removeAttribute('aria-labelledby');
      techEl.removeAttribute('aria-describedby');
    }

    super.dispose();
    this.els = null;
  }
}

Component.registerComponent('TitleBar', TitleBar);

export default TitleBar;
