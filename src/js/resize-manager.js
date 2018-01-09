/**
 * @file resize-manager.js
 */
import window from 'global/window';
import * as Fn from './utils/fn.js';
import Component from './component.js';

const RESIZE_OBSERVER_AVAILABLE = window.ResizeObserver;

class ResizeManager extends Component {
  constructor(player, options) {
    super(player, options);

    this.iframeResizeHandler_ = null;
    this.loadListener_ = null;
    this.resizeObserver = null;

    if (RESIZE_OBSERVER_AVAILABLE) {
      this.resizeObserver = new window.ResizeObserver(() => this.resizeHandler());
      this.resizeObserver.observe(player.el());

    } else {
      this.iframeResizeHandler_ = Fn.throttle(() => this.resizeHandler(), 50);
      this.loadListener_ = () => {
        if (this.el_.contentWindow) {
          this.el_.contentWindow.addEventListener('resize', this.iframeResizeHandler_);
        }
        this.el_.removeEventListener('load', this.loadListener_);
      };

      this.el_.addEventListener('load', this.loadListener_);
    }
  }

  createEl() {
    if (RESIZE_OBSERVER_AVAILABLE) {
      return;
    }

    return super.createEl('iframe', {
      className: 'vjs-resize-manager'
    });
  }

  resizeHandler() {
    this.player_.trigger('playerresize');
  }

  dispose() {
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(this.player.el());
      this.resizeObserver.disconnect();
    }

    if (this.iframeResizeHandler_ && this.el_.contentWindow) {
      this.el_.contentWindow.removeEventListener('resize', this.iframeResizeHandler_);
    }

    if (this.loadListener_) {
      this.el_.removeEventListener('load', this.loadListener_);
    }

    this.resizeObserver = null;
    this.iframeResizeHandler_ = null;
    this.loadListener_ = null;
  }

}

Component.registerComponent('ResizeManager', ResizeManager);
export default ResizeManager;
