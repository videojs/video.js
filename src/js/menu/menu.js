/**
 * @file menu.js
 */
import Component from '../component.js';
import * as Dom from '../utils/dom.js';
import * as Fn from '../utils/fn.js';
import * as Events from '../utils/events.js';

/**
 * The Menu component is used to build popup menus, including subtitle and
 * captions selection menus.
 *
 * @extends Component
 */
class Menu extends Component {

  /**
   * Create an instance of this class.
   *
   * @param {Player} player
   *        the player that this component should attach to
   *
   * @param {Object} [options]
   *        Object of option names and values
   *
   */
  constructor(player, options) {
    super(player, options);

    this.focusedChild_ = -1;

    this.on('keydown', this.handleKeyPress);
  }

  /**
   * Add a {@link MenuItem} to the menu.
   *
   * @param {Object|string} component
   *        The name or instance of the `MenuItem` to add.
   *
   */
  addItem(component) {
    this.addChild(component);
    component.on('click', Fn.bind(this, function(event) {
      this.unlockShowing();
      // TODO: Need to set keyboard focus back to the menuButton
    }));
  }

  /**
   * Create the `Menu`s DOM element.
   *
   * @return {Element}
   *         the element that was created
   */
  createEl() {
    const contentElType = this.options_.contentElType || 'ul';

    this.contentEl_ = Dom.createEl(contentElType, {
      className: 'vjs-menu-content'
    });

    this.contentEl_.setAttribute('role', 'menu');

    const el = super.createEl('div', {
      append: this.contentEl_,
      className: 'vjs-menu'
    });

    el.setAttribute('role', 'presentation');
    el.appendChild(this.contentEl_);

    // Prevent clicks from bubbling up. Needed for Menu Buttons,
    // where a click on the parent is significant
    Events.on(el, 'click', function(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    });

    return el;
  }

  /**
   * Handle a `keydown` event on this menu. This listener is added in the constructor.
   *
   * @param {EventTarget~Event} event
   *        A `keydown` event that happened on the menu.
   *
   * @listens keydown
   */
  handleKeyPress(event) {
    // Left and Down Arrows
    if (event.which === 37 || event.which === 40) {
      event.preventDefault();
      this.stepForward();

    // Up and Right Arrows
    } else if (event.which === 38 || event.which === 39) {
      event.preventDefault();
      this.stepBack();
    }
  }

  /**
   * Move to next (lower) menu item for keyboard users.
   */
  stepForward() {
    let stepChild = 0;

    if (this.focusedChild_ !== undefined) {
      stepChild = this.focusedChild_ + 1;
    }
    this.focus(stepChild);
  }

  /**
   * Move to previous (higher) menu item for keyboard users.
   */
  stepBack() {
    let stepChild = 0;

    if (this.focusedChild_ !== undefined) {
      stepChild = this.focusedChild_ - 1;
    }
    this.focus(stepChild);
  }

  /**
   * Set focus on a {@link MenuItem} in the `Menu`.
   *
   * @param {Object|string} [item=0]
   *        Index of child item set focus on.
   */
  focus(item = 0) {
    const children = this.children().slice();
    const haveTitle = children.length && children[0].className &&
      (/vjs-menu-title/).test(children[0].className);

    if (haveTitle) {
      children.shift();
    }

    if (children.length > 0) {
      if (item < 0) {
        item = 0;
      } else if (item >= children.length) {
        item = children.length - 1;
      }

      this.focusedChild_ = item;

      children[item].el_.focus();
    }
  }
}

Component.registerComponent('Menu', Menu);
export default Menu;
