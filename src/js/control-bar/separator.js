import Component from '../component.js';

/**
* Just an empty separator element that can be used as an append point for plugins, etc.
* Also can be used to create space between elements when necessary.
*
* @param {vjs.Player|Object} player
* @param {Object=} options
* @constructor
*/

class Separator extends Component {
  /** @constructor */
  constructor(player, options) {
    super(this, player, options);
  }

  createEl() {
    return super(this, 'div', {
      className: 'vjs-separator-control'
    });
  }
}
