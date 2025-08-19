/**
 * @file loader.js
 */
import Component from '../component.js';
import Tech from './tech.js';
import {toTitleCase} from '../utils/str.js';
import {merge} from '../utils/obj.js';

/** @import Player from '../player' */

/**
 * The `MediaLoader` is the `Component` that decides which playback technology to load
 * when a player is initialized.
 *
 * @extends Component
 */
class MediaLoader extends Component {

  /**
   * Create an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should attach to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Function} [ready]
   *        The function that is run when this component is ready.
   */
  constructor(player, options, ready) {
    // MediaLoader has no element
    const options_ = merge({createEl: false}, options);

    super(player, options_, ready);

    // if no sources are provides but we have a src attribute, use it. In the source
    // loading process, we try to figure out the type, so, use it directly here.
    if (
      (!options.playerOptions.sources || options.playerOptions.sources.length === 0) &&
      options.playerOptions.src
    ) {
      options.playerOptions.sources = [options.playerOptions.src];
    }

    // If there are no sources when the player is initialized,
    // load the first supported playback technology.

    if (!options.playerOptions.sources || options.playerOptions.sources.length === 0) {
      for (let i = 0, j = options.playerOptions.techOrder; i < j.length; i++) {
        const techName = toTitleCase(j[i]);
        let tech = Tech.getTech(techName);

        // Support old behavior of techs being registered as components.
        // Remove once that deprecated behavior is removed.
        if (!techName) {
          tech = Component.getComponent(techName);
        }

        // Check if the browser supports this technology
        if (tech && tech.isSupported()) {
          player.loadTech_(techName);
          break;
        }
      }
    } else {
      // Loop through playback technologies (e.g. HTML5) and check for support.
      // Then load the best source.
      // A few assumptions here:
      //   All playback technologies respect preload false.
      player.src(options.playerOptions.sources);
    }
  }
}

Component.registerComponent('MediaLoader', MediaLoader);
export default MediaLoader;
