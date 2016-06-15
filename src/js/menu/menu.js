/**
 * @file menu.js
 */
import Component from '../component.js';
import * as Dom from '../utils/dom.js';
import * as Fn from '../utils/fn.js';
import * as Events from '../utils/events.js';

/**
 * The Menu component is used to build pop up menus, including subtitle and
 * captions selection menus.
 *
 * @extends Component
 * @class Menu
 */
class Menu extends Component {

  constructor (player, options) {
    super(player, options);

    this.focusedChild_ = -1;

    this.on('keydown', this.handleKeyPress);
  }

  /**
   * Add a menu item to the menu
   *
   * @param {Object|String} component Component or component type to add
   * @method addItem
   */
  addItem(component) {
    this.addChild(component);
    component.on('click', Fn.bind(this, function(){
      this.unlockShowing();
      //TODO: Need to set keyboard focus back to the menuButton
    }));
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    let contentElType = this.options_.contentElType || 'ul';
    this.contentEl_ = Dom.createEl(contentElType, {
      className: 'vjs-menu-content'
    });
    this.contentEl_.setAttribute('role', 'menu');
    var el = super.createEl('div', {
      append: this.contentEl_,
      className: 'vjs-menu'
    });
    el.setAttribute('role', 'presentation');
    el.appendChild(this.contentEl_);

    // Prevent clicks from bubbling up. Needed for Menu Buttons,
    // where a click on the parent is significant
    Events.on(el, 'click', function(event){
      event.preventDefault();
      event.stopImmediatePropagation();
    });

    return el;
  }

  /**
   * Handle key press for menu
   *
   * @param {Object} event Event object
   * @method handleKeyPress
   */
  handleKeyPress (event) {
    if (event.which === 37 || event.which === 40) { // Left and Down Arrows
      event.preventDefault();
      this.stepForward();
    } else if (event.which === 38 || event.which === 39) { // Up and Right Arrows
      event.preventDefault();
      this.stepBack();
    }
  }

  /**
   * Move to next (lower) menu item for keyboard users
   *
   * @method stepForward
   */
   stepForward () {
     let stepChild = 0;

     if (this.focusedChild_ !== undefined) {
       stepChild = this.focusedChild_ + 1;
     }
     this.focus(stepChild);
   }

   /**
    * Move to previous (higher) menu item for keyboard users
    *
    * @method stepBack
    */
  stepBack () {
    let stepChild = 0;

    if (this.focusedChild_ !== undefined) {
      stepChild = this.focusedChild_ - 1;
    }
    this.focus(stepChild);
  }

  /**
   * Set focus on a menu item in the menu
   *
   * @param {Object|String} item Index of child item set focus on
   * @method focus
   */
  focus (item = 0) {
    let children = this.children().slice();
    let haveTitle = children.length && children[0].className &&
      /vjs-menu-title/.test(children[0].className);

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
