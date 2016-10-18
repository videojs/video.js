/**
 * @file plugins.js
 * @module plugins
 */
import * as Fn from './utils/fn';
import * as Obj from './utils/obj';
import EventTarget from './event-target';
import Player from './player';

/**
 * Cache of plugins that have been registered.
 *
 * @type {Object}
 */
const plugins = {};

/**
 * Plugin wrapper methods.
 *
 * @private
 * @type {Object}
 */
const wrapperMethods = Obj.assign({

  /**
   * Provides boilerplate for a plugin teardown process.
   *
   * @param  {...Mixed} args
   */
  teardown(...args) {
    if (!this.active_) {
      return;
    }

    this.trigger('beforeteardown');

    // Plugins can be initialized more than once; so, this allows us to track
    // the number of times this has happened - potentially for debug purposes.
    this.active_ = false;
    this.teardown(...args);
    this.trigger('teardown');
  },

  /**
   * Provides boilerplate for a plugin disposal process.
   *
   * @param  {...Mixed} args
   */
  dispose(...args) {
    if (this.active_) {
      this.teardown();
    }

    this.trigger('beforedispose');
    this.dispose(...args);
    this.off();
    this.trigger('dispose');

    // Eliminate possible sources of leaking memory after disposal.
    delete this.player_[this.name_];
    this.player_ = this.state_ = null;
  },

  /**
   * Getter/setter for a state management on a per-player/per-plugin basis.
   *
   * @param  {Object} [props]
   *         If provided, acts as a setter.
   * @return {Object}
   */
  state(props) {
    if (props && typeof props === 'object') {
      this.trigger('beforestatechange', props);
      Obj.assign(this.state_, props);
      this.trigger('statechange');
    }

    return this.state_;
  },

  /**
   * Whether or not this plugin is active on this player.
   *
   * @return {Boolean}
   */
  active() {
    return this.active_;
  },

  /**
   * The version number of this plugin, if available.
   *
   * @return {String}
   */
  version() {
    return this.VERSION || '';
  }
}, EventTarget.prototype);

/**
 * Normalize an object or function into an object proper for validating and
 * creating a plugin.
 *
 * @param  {Object|Function} obj
 * @return {Object}
 */
const normalize = (obj) => {
  if (typeof obj === 'function') {
    return Obj.assign({setup: obj}, obj);
  }
  return obj;
};

/**
 * Takes an object with at least a setup method on it and returns a wrapped
 * function that will initialize the plugin and handle per-player state setup.
 *
 * @private
 * @param  {String} name
 * @param  {Object} plugin
 * @return {Function}
 */
const implement = (name, plugin) => {

  // Create a Player.prototype-level plugin wrapper that only gets called
  // once per player.
  plugins[name] = Player.prototype[name] = function(...firstArgs) {

    // Replace this function with a new player-specific plugin wrapper.
    const wrapper = function(...args) {
      if (this.active_) {
        this.teardown();
      }

      this.trigger('beforesetup');
      plugin.setup(...args);
      this.trigger('setup');
    };

    // Wrapper is bound to itself to preserve expectations.
    this[name] = Fn.bind(wrapper, wrapper);

    // Add EventTarget methods and custom, per-player properties to the wrapper object.
    Obj.assign(wrapper, wrapperMethods, {
      active_: false,
      name_: name,
      player_: this,
      state_: {}
    });

    // Wrap/mirror all own properties of the source `plugin` object that are
    // NOT present on the wrapper object onto the wrapper object.
    Obj.each(plugin, (value, key) => {
      if (wrapper.hasOwnProperty(key)) {
        return;
      }
      wrapper[key] = plugin[key];
    });

    // Bind all methods of the wrapper to itself.
    Obj.each(wrapper, (value, key) => {
      if (typeof value === 'function') {
        wrapper[key] = Fn.bind(this, value);
      }
    });

    // Finally, call the player-specific plugin wrapper.
    wrapper(...firstArgs);
  };
};

/**
 *
 * The method for registering a video.js plugin. {@link videojs:videojs.registerPlugin].
 *
 * @param {string} name
 *        The name of the plugin that is being registered
 *
 * @param {plugins:PluginFn} init
 */
const registerPlugin = function(name, obj) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('illegal plugin name; must be non-empty string');
  }

  if (Player.prototype[name]) {
    throw new Error(`illegal plugin name; "${name}" already exists`);
  }

  const plugin = normalize(obj);

  if (typeof plugin.setup !== 'function') {
    throw new Error('illegal setup() method; should be a function');
  }

  // If optional methods exist, they should be functions.
  ['dispose', 'teardown'].forEach(method => {
    if (plugin[method] && typeof plugin[method] !== 'function') {
      throw new Error(`illegal ${method}() method; should be a function`);
    }
  });

  implement(plugin);
};

export default registerPlugin;
