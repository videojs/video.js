/**
 * @file resize-manager.js
 */
import Component from './component.js';

class ResizeManager extends Component {
  constructor(player, options) {
    super(player, options);

    this.el_.addEventListener('load', () => {
      this.el_.contentWindow.addEventListener('resize', (event) => this.resizeHandler(event));
    });
  }

  createEl() {
    return super.createEl('iframe', {
      className: 'vjs-resize-manager'
    });
  }

  resizeHandler(event) {
    // this.player_.trigger('playerresize');

    const width = this.player_.currentWidth();

    console.log(width, width/10, width/50, width/100);

    // this.player_.el_.style.fontSize = width/50 + 'px';
  }
}

Component.registerComponent('ResizeManager', ResizeManager);
export default ResizeManager;
