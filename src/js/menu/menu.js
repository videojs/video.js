/**
 * @file menu.js
 */
import Component from '../component.js';
import document from 'global/document';
import * as Dom from '../utils/dom.js';
import * as Events from '../utils/events.js';
import keycode from 'keycode';

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

    if (options) {
      this.menuButton_ = options.menuButton;
    }

    this.focusedChild_ = -1;

    this.on('keydown', (e) => this.handleKeyDown(e));

    // All the menu item instances share the same blur handler provided by the menu container.
    this.boundHandleBlur_ = (e) => this.handleBlur(e);
    this.boundHandleTapClick_ = (e) => this.handleTapClick(e);
  }

  /**
   * Add event listeners to the {@link MenuItem}.
   *
   * @param {Object} component
   *        The instance of the `MenuItem` to add listeners to.
   *
   */
  addEventListenerForItem(component) {
    if (!(component instanceof Component)) {
      return;
    }

    this.on(component, 'blur', this.boundHandleBlur_);
    this.on(component, ['tap', 'click'], this.boundHandleTapClick_);
  }

  /**
   * Remove event listeners from the {@link MenuItem}.
   *
   * @param {Object} component
   *        The instance of the `MenuItem` to remove listeners.
   *
   */
  removeEventListenerForItem(component) {
    if (!(component instanceof Component)) {
      return;
    }

    this.off(component, 'blur', this.boundHandleBlur_);
    this.off(component, ['tap', 'click'], this.boundHandleTapClick_);
  }

  /**
   * This method will be called indirectly when the component has been added
   * before the component adds to the new menu instance by `addItem`.
   * In this case, the original menu instance will remove the component
   * by calling `removeChild`.
   *
   * @param {Object} component
   *        The instance of the `MenuItem`
   */
  removeChild(component) {
    if (typeof component === 'string') {
      component = this.getChild(component);
    }

    this.removeEventListenerForItem(component);
    super.removeChild(component);
  }

  /**
   * Add a {@link MenuItem} to the menu.
   *
   * @param {Object|string} component
   *        The name or instance of the `MenuItem` to add.
   *
   */
  addItem(component) {
    const childComponent = this.addChild(component);

    if (childComponent) {
      this.addEventListenerForItem(childComponent);
    }
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

    el.appendChild(this.contentEl_);

    // Prevent clicks from bubbling up. Needed for Menu Buttons,
    // where a click on the parent is significant
    Events.on(el, 'click', function(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    });

    return el;
  }

  dispose() {
    this.contentEl_ = null;
    this.boundHandleBlur_ = null;
    this.boundHandleTapClick_ = null;

    super.dispose();
  }

  /**
   * Called when a `MenuItem` loses focus.
   *
   * @param {EventTarget~Event} event
   *        The `blur` event that caused this function to be called.
   *
   * @listens blur
   */
  handleBlur(event) {
    const relatedTarget = event.relatedTarget || document.activeElement;

    // Close menu popup when a user clicks outside the menu
    if (!this.children().some((element) => {
      return element.el() === relatedTarget;
    })) {
      const btn = this.menuButton_;

      if (btn && btn.buttonPressed_ && relatedTarget !== btn.el().firstChild) {
        btn.unpressButton();
      }
    }
  }

  /**
   * Called when a `MenuItem` gets clicked or tapped.
   *
   * @param {EventTarget~Event} event
   *        The `click` or `tap` event that caused this function to be called.
   *
   * @listens click,tap
   */
  handleTapClick(event) {
    // Unpress the associated MenuButton, and move focus back to it
    if (this.menuButton_) {
      this.menuButton_.unpressButton();

      const childComponents = this.children();

      if (!Array.isArray(childComponents)) {
        return;
      }

      const foundComponent = childComponents.filter(component => component.el() === event.target)[0];

      if (!foundComponent) {
        return;
      }

      // don't focus menu button if item is a caption settings item
      // because focus will move elsewhere
      if (foundComponent.name() !== 'CaptionSettingsMenuItem') {
        this.menuButton_.focus();
      }
    }
  }

  /**
   * Handle a `keydown` event on this menu. This listener is added in the constructor.
   *
   * @param {EventTarget~Event} event
   *        A `keydown` event that happened on the menu.
   *
   * @listens keydown
   */
  handleKeyDown(event) {

    // Left and Down Arrows
    if (keycode.isEventKey(event, 'Left') || keycode.isEventKey(event, 'Down')) {
      event.preventDefault();
      event.stopPropagation();
      this.stepForward();

    // Up and Right Arrows
    } else if (keycode.isEventKey(event, 'Right') || keycode.isEventKey(event, 'Up')) {
      event.preventDefault();
      event.stopPropagation();
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
    const haveTitle = children.length && children[0].hasClass('vjs-menu-title');

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
