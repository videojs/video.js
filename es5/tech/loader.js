'use strict';

exports.__esModule = true;

var _component = require('../component.js');

var _component2 = _interopRequireDefault(_component);

var _tech = require('./tech.js');

var _tech2 = _interopRequireDefault(_tech);

var _toTitleCase = require('../utils/to-title-case.js');

var _toTitleCase2 = _interopRequireDefault(_toTitleCase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file loader.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


/**
 * The `MediaLoader` is the `Component` that decides which playback technology to load
 * when a player is initialized.
 *
 * @extends Component
 */
var MediaLoader = function (_Component) {
  _inherits(MediaLoader, _Component);

  /**
   * Create an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should attach to.
   *
   * @param {Object} [options]
   *        The key/value stroe of player options.
   *
   * @param {Component~ReadyCallback} [ready]
   *        The function that is run when this component is ready.
   */
  function MediaLoader(player, options, ready) {
    _classCallCheck(this, MediaLoader);

    // If there are no sources when the player is initialized,
    // load the first supported playback technology.

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options, ready));

    if (!options.playerOptions.sources || options.playerOptions.sources.length === 0) {
      for (var i = 0, j = options.playerOptions.techOrder; i < j.length; i++) {
        var techName = (0, _toTitleCase2['default'])(j[i]);
        var tech = _tech2['default'].getTech(techName);

        // Support old behavior of techs being registered as components.
        // Remove once that deprecated behavior is removed.
        if (!techName) {
          tech = _component2['default'].getComponent(techName);
        }

        // Check if the browser supports this technology
        if (tech && tech.isSupported()) {
          player.loadTech_(techName);
          break;
        }
      }
    } else {
      // Loop through playback technologies (HTML5, Flash) and check for support.
      // Then load the best source.
      // A few assumptions here:
      //   All playback technologies respect preload false.
      player.src(options.playerOptions.sources);
    }
    return _this;
  }

  return MediaLoader;
}(_component2['default']);

_component2['default'].registerComponent('MediaLoader', MediaLoader);
exports['default'] = MediaLoader;
