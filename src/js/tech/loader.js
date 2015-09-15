/**
 * @file loader.js
 */
import Component from '../component';
import window from 'global/window';
import toTitleCase from '../utils/to-title-case.js';

/**
 * The Media Loader is the component that decides which playback technology to load
 * when the player is initialized.
 *
 * @param {Object} player  Main Player
 * @param {Object=} options Object of option names and values
 * @param {Function=} ready    Ready callback function
 * @extends Component
 * @class MediaLoader
 */
class MediaLoader extends Component {

  constructor(player, options, ready){
    super(player, options, ready);

    // If there are no sources when the player is initialized,
    // load the first supported playback technology.

    if (!options.playerOptions['sources'] || options.playerOptions['sources'].length === 0) {
      for (let i=0, j=options.playerOptions['techOrder']; i<j.length; i++) {
        let techName = toTitleCase(j[i]);
        let tech = Component.getComponent(techName);

        // Check if the browser supports this technology
        if (tech && tech.isSupported()) {
          player.loadTech_(techName);
          break;
        }
      }
    } else {
      // // Loop through playback technologies (HTML5, Flash) and check for support.
      // // Then load the best source.
      // // A few assumptions here:
      // //   All playback technologies respect preload false.
      player.src(options.playerOptions['sources']);
    }
  }
}

Component.registerComponent('MediaLoader', MediaLoader);
export default MediaLoader;
