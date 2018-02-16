/**
 * @file resize-manager.js
 */
import window from 'global/window';
import { debounce } from './utils/fn.js';
import * as Events from './utils/events.js';
import mergeOptions from './utils/merge-options.js';
import Component from './component.js';

/**
 * A Resize Manager. It is in charge of triggering `playerresize` on the player in the right conditions.
 *
 * It'll either create an iframe and use a debounced resize handler on it or use the new {@link https://wicg.github.io/ResizeObserver/|ResizeObserver}.
 *
 * If the ResizeObserver is available natively, it will be used. A polyfill can be passed in as an option.
 * If a `playerresize` event is not needed, the ResizeManager component can be removed from the player, see the example below.
 * @example <caption>How to disable the resize manager</caption>
 * const player = videojs('#vid', {
 *   resizeManager: false
 * });
 *
 * @see {@link https://wicg.github.io/ResizeObserver/|ResizeObserver specification}
 *
 * @extends Component
 */
class ResizeManager extends Component {

  /**
   * Create the ResizeManager.
   *
   * @param {Object} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of ResizeManager options.
   *
   * @param {Object} [options.ResizeObserver]
   *        A polyfill for ResizeObserver can be passed in here.
   *        If this is set to null it will ignore the native ResizeObserver and fall back to the iframe fallback.
   */
  constructor(player, options) {
    let RESIZE_OBSERVER_AVAILABLE = options.ResizeObserver || window.ResizeObserver;

    // if `null` was passed, we want to disable the ResizeObserver
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

  /**
   * Called when a resize is triggered on the iframe or a resize is observed via the ResizeObserver
   *
   * @fires Player#playerresize
   */
  resizeHandler() {
    /**
     * Called when the player size has changed
     *
     * @event Player#playerresize
     * @type {EventTarget~Event}
     */
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
