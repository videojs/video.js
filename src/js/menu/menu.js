import Component from '../component.js';
import * as Lib from '../lib.js';
import * as Events from '../events.js';

/* Menu
================================================================================ */
/**
 * The Menu component is used to build pop up menus, including subtitle and
 * captions selection menus.
 *
 * @param {Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
class Menu extends Component {

  /**
   * Add a menu item to the menu
   * @param {Object|String} component Component or component type to add
   */
  addItem(component) {
    this.addChild(component);
    component.on('click', Lib.bind(this, function(){
      this.unlockShowing();
    }));
  }

  createEl() {
    let contentElType = this.options().contentElType || 'ul';
    this.contentEl_ = Lib.createEl(contentElType, {
      className: 'vjs-menu-content'
    });
    var el = super.createEl('div', {
      append: this.contentEl_,
      className: 'vjs-menu'
    });
    el.appendChild(this.contentEl_);

    // Prevent clicks from bubbling up. Needed for Menu Buttons,
    // where a click on the parent is significant
    Events.on(el, 'click', function(event){
      event.preventDefault();
      event.stopImmediatePropagation();
    });

    return el;
  }
}

Component.registerComponent('Menu', Menu);
export default Menu;
