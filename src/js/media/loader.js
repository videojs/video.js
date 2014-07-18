var MediaLoader, Component, vjslib;

Component = require('../component.js');
vjslib = require('../lib.js');

/**
 * The Media Loader is the component that decides which playback technology to load
 * when the player is initialized.
 *
 * @constructor
 */
MediaLoader = Component.extend({
  /** @constructor */
  init: function(player, options, ready){
    var components = require('../components.js');

    Component.call(this, player, options, ready);

    // If there are no sources when the player is initialized,
    // load the first supported playback technology.
    if (!player.options_['sources'] || player.options_['sources'].length === 0) {
      for (var i=0,j=player.options_['techOrder']; i<j.length; i++) {
        var techName = vjslib.capitalize(j[i]),
            tech = components[techName];

        // Check if the browser supports this technology
        if (tech && tech.isSupported()) {
          player.loadTech(techName);
          break;
        }
      }
    } else {
      // // Loop through playback technologies (HTML5, Flash) and check for support.
      // // Then load the best source.
      // // A few assumptions here:
      // //   All playback technologies respect preload false.
      player.src(player.options_['sources']);
    }
  }
});

module.exports = MediaLoader;
