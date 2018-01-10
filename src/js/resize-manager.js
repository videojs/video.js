/**
 * @file resize-manager.js
 */
import window from 'global/window';
import * as Fn from './utils/fn.js';
import * as Events from './utils/events.js';
import Component from './component.js';

class ResizeManager extends Component {
  constructor(player, options) {
    super(player, options);

    this.ResizeObserver = options.ResizeObserver || window.ResizeObserver;
    this.iframeResizeHandler_ = null;
    this.loadListener_ = null;
    this.resizeObserver = null;

    if (this.ResizeObserver) {
      this.resizeObserver = new this.ResizeObserver(() => this.resizeHandler());
      this.resizeObserver.observe(player.el());

    } else {
      this.iframeResizeHandler_ = Fn.throttle(() => this.resizeHandler(), 50);
      this.loadListener_ = () => {
        if (this.el_.contentWindow) {
          Events.on(this.el_.contentWindow, 'resize', this.iframeResizeHandler_);
        }
        this.off('load', this.loadListener_);
      };

      this.on('load', this.loadListener_);
    }
  }

  createEl() {
    if (this.ResizeObserver) {
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
      Events.off(this.el_.contentWindow, 'resize', this.iframeResizeHandler_);
    }

    if (this.loadListener_) {
      this.off('load', this.loadListener_);
    }

    this.resizeObserver = null;
    this.iframeResizeHandler_ = null;
    this.loadListener_ = null;
  }

}

Component.registerComponent('ResizeManager', ResizeManager);
export default ResizeManager;
