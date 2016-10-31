/**
 * @file popup.js
 */
import Component from '../component.js';
import * as Dom from '../utils/dom.js';
import * as Fn from '../utils/fn.js';
import * as Events from '../utils/events.js';

/**
 * The Popup component is used to build pop up controls.
 *
 * @extends Component
 */
class Popup extends Component {

  /**
   * Add a popup item to the popup
   *
   * @param {Object|string} component
   *        Component or component type to add
   *
   */
  addItem(component) {
    this.addChild(component);
    component.on('click', Fn.bind(this, function() {
      this.unlockShowing();
    }));
  }

  /**
   * Create the `PopupButton`s DOM element.
   *
   * @return {Element}
   *         The element that gets created.
   */
  createEl() {
    const contentElType = this.options_.contentElType || 'ul';

    this.contentEl_ = Dom.createEl(contentElType, {
      className: 'vjs-menu-content'
    });

    const el = super.createEl('div', {
      append: this.contentEl_,
      className: 'vjs-menu'
    });

    el.appendChild(this.contentEl_);

    // Prevent clicks from bubbling up. Needed for Popup Buttons,
    // where a click on the parent is significant
    Events.on(el, 'click', function(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    });

    return el;
  }
}

Component.registerComponent('Popup', Popup);
export default Popup;
