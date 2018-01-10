/**
 * @file resize-manager.js
 */
import window from 'global/window';
import { debounce } from './utils/fn.js';
import * as Events from './utils/events.js';
import mergeOptions from './utils/merge-options.js';
import Component from './component.js';

class ResizeManager extends Component {
  constructor(player, options) {
    let RESIZE_OBSERVER_AVAILABLE = options.ResizeObserver || window.ResizeObserver;

    if (options.ResizeObserver === null) {
      RESIZE_OBSERVER_AVAILABLE = false;
    }

    // Only create an element when ResizeObserver isn't available
    const options_ = mergeOptions({createEl: !RESIZE_OBSERVER_AVAILABLE}, options);

    super(player, options_);

    this.ResizeObserver = options.ResizeObserver || window.ResizeObserver;
    this.loadListener_ = null;
    this.resizeObserver_ = null;
    this.debouncedHandler_ = debounce(() => {
      this.resizeHandler();
    }, 100, false, player);

    if (RESIZE_OBSERVER_AVAILABLE) {
      this.resizeObserver_ = new this.ResizeObserver(this.debouncedHandler_);
      this.resizeObserver_.observe(player.el());

    } else {
      this.loadListener_ = () => {
        if (this.el_.contentWindow) {
          Events.on(this.el_.contentWindow, 'resize', this.debouncedHandler_);
        }
        this.off('load', this.loadListener_);
      };

      this.on('load', this.loadListener_);
    }
  }

  createEl() {
    return super.createEl('iframe', {
      className: 'vjs-resize-manager'
    });
  }

  resizeHandler() {
    this.player_.trigger('playerresize');
  }

  dispose() {
    if (this.resizeObserver_) {
      this.resizeObserver_.unobserve(this.player_.el());
      this.resizeObserver_.disconnect();
    }

    if (this.el_ && this.el_.contentWindow) {
      Events.off(this.el_.contentWindow, 'resize', this.debouncedHandler_);
    }

    if (this.loadListener_) {
      this.off('load', this.loadListener_);
    }

    this.ResizeObserver = null;
    this.resizeObserver = null;
    this.debouncedHandler_ = null;
    this.loadListener_ = null;
  }

}

Component.registerComponent('ResizeManager', ResizeManager);
export default ResizeManager;
