import EventTarget from './event-target';
import * as Fn from './utils/fn';

/**
 * A Plugin object represents an interface between a Player and a plugin as
 * registered with videojs.
 *
 * A Plugin is returned by the Player#plugin() method.
 */
class Plugin extends EventTarget {

  /**
   * Creates a plugin object for a specific plugin on a specific player.
   *
   * @param  {Player} player
   * @param  {String} name
   * @param  {Object} plugin
   *         Contains properties like `init` and `dispose` that were
   *         created when registering a plugin with videojs.
   */
  constructor(player, name, plugin) {
    super();

    this.active_ = false;
    this.name_ = name;
    this.player_ = player;
    this.plugin_ = plugin;
    this.state_ = {};

    ['init', 'deinit', 'dispose', 'state', 'version'].forEach(k => {
      this[k] = Fn.bind(this, this[k]);
    });

    this.player_.on('dispose', this.dispose);
  }

  /**
   * Initializes a plugin on a player.
   *
   * @fires  Plugin#beforeinit
   * @fires  Plugin#init
   * @param  {...Mixed} args
   *         If the plugin author defined a `dispose()` method, we pass any
   *         arguments along to it.
   */
  init(...args) {
    if (this.active_) {
      this.deinit();
    }

    /**
     * This event fires before the plugin has been initialized on this player.
     *
     * @event Plugin#beforeinit
     */
    this.trigger('beforeinit');
    this.active_ = true;
    this.plugin_.init.apply(this.player_, args);

    /**
     * This event fires after the plugin has been initialized on this player.
     *
     * @event Plugin#init
     */
    this.trigger('init');
  }

  /**
   * De-inits a plugin on a player. This is similar to disposing, but it
   * preserves references. This should be used when a plugin may be re-
   * initialized at a later time.
   *
   * @fires  Plugin#beforedeinit
   * @fires  Plugin#deinit
   * @param  {...Mixed} args
   *         If the plugin author defined a `deinit()` method, we pass
   *         any arguments along to it.
   */
  deinit(...args) {
    if (!this.active_) {
      return;
    }

    /**
     * This event fires before the plugin has been initialized on this player.
     *
     * @event Plugin#beforedeinit
     */
    this.trigger('beforedeinit');

    // Plugins can be initialized more than once; so, this allows us to track
    // the number of times this has happened - potentially for debug purposes.
    this.active_ = false;
    this.plugin_.deinit.apply(this.player_, args);

    /**
     * This event fires after the plugin has been initialized on this player.
     *
     * @event Plugin#deinit
     */
    this.trigger('deinit');
  }

  /**
   * Disposes a plugin that was previously initialized on a player.
   *
   * @fires  Plugin#beforedispose
   * @fires  Plugin#dispose
   * @param  {...Mixed} args
   *         If the plugin author defined a `dispose()` method, we pass any
   *         arguments along to it.
   */
  dispose(...args) {
    if (this.active_) {
      this.deinit();
    }

    /**
     * This event fires before the plugin has been disposed from this player.
     *
     * @event Plugin#beforedispose
     */
    this.trigger('beforedispose');
    this.plugin_.dispose.apply(this.player_, args);

    // Eliminate the references between the Player object and Plugin object.
    this.player_.plugins_[this.name_] = null;
    this.player_ = null;
    this.state_ = null;

    /**
     * This event fires after the plugin has been disposed from this player.
     *
     * @event Plugin#dispose
     */
    this.trigger('dispose');
  }

  /**
   * Whether or not this plugin is active on this player.
   *
   * @return {Boolean}
   */
  active() {
    return this.active_;
  }

  /**
   * Get or set any stored state for a plugin.
   *
   * @fires  Plugin#beforestatechange
   * @fires  Plugin#statechange
   * @param  {Object} [props]
   *         If given, will update the plugin's state object.
   * @return {Object}
   */
  state(props) {
    if (props && typeof props === 'object') {

      /**
       * If properties were passed to `state()`, this event fires before the
       * internal state has been modified.
       *
       * @event Plugin#beforestatechange
       * @type  {Object}
       */
      this.trigger('beforestatechange', props);
      Object.keys(props).forEach(k => {
        this.state_[k] = props[k];
      });

      /**
       * If properties were passed to `state()`, this event fires after the
       * internal state has been modified.
       *
       * @event Plugin#statechange
       */
      this.trigger('statechange');
    }
    return this.state_;
  }

  /**
   * Get the version of the plugin, if available.
   *
   * @return {String}
   *         If the version is unknown, will be an empty string.
   */
  version() {
    return this.plugin_.VERSION || '';
  }
}

export default Plugin;
