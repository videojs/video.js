'use strict';

exports.__esModule = true;

var _component = require('../component');

var _component2 = _interopRequireDefault(_component);

var _fn = require('../utils/fn.js');

var Fn = _interopRequireWildcard(_fn);

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file text-track-display.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


var darkGray = '#222';
var lightGray = '#ccc';
var fontMap = {
  monospace: 'monospace',
  sansSerif: 'sans-serif',
  serif: 'serif',
  monospaceSansSerif: '"Andale Mono", "Lucida Console", monospace',
  monospaceSerif: '"Courier New", monospace',
  proportionalSansSerif: 'sans-serif',
  proportionalSerif: 'serif',
  casual: '"Comic Sans MS", Impact, fantasy',
  script: '"Monotype Corsiva", cursive',
  smallcaps: '"Andale Mono", "Lucida Console", monospace, sans-serif'
};

/**
 * Construct an rgba color from a given hex color code.
 *
 * @param {number} color
 *        Hex number for color, like #f0e.
 *
 * @param {number} opacity
 *        Value for opacity, 0.0 - 1.0.
 *
 * @return {string}
 *         The rgba color that was created, like 'rgba(255, 0, 0, 0.3)'.
 *
 * @private
 */
function constructColor(color, opacity) {
  return 'rgba(' +
  // color looks like "#f0e"
  parseInt(color[1] + color[1], 16) + ',' + parseInt(color[2] + color[2], 16) + ',' + parseInt(color[3] + color[3], 16) + ',' + opacity + ')';
}

/**
 * Try to update the style of a DOM element. Some style changes will throw an error,
 * particularly in IE8. Those should be noops.
 *
 * @param {Element} el
 *        The DOM element to be styled.
 *
 * @param {string} style
 *        The CSS property on the element that should be styled.
 *
 * @param {string} rule
 *        The style rule that should be applied to the property.
 */
function tryUpdateStyle(el, style, rule) {
  try {
    el.style[style] = rule;
  } catch (e) {

    // Satisfies linter.
    return;
  }
}

/**
 * The component for displaying text track cues.
 *
 * @extends Component
 */

var TextTrackDisplay = function (_Component) {
  _inherits(TextTrackDisplay, _Component);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Component~ReadyCallback} [ready]
   *        The function to call when `TextTrackDisplay` is ready.
   */
  function TextTrackDisplay(player, options, ready) {
    _classCallCheck(this, TextTrackDisplay);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options, ready));

    player.on('loadstart', Fn.bind(_this, _this.toggleDisplay));
    player.on('texttrackchange', Fn.bind(_this, _this.updateDisplay));

    // This used to be called during player init, but was causing an error
    // if a track should show by default and the display hadn't loaded yet.
    // Should probably be moved to an external track loader when we support
    // tracks that don't need a display.
    player.ready(Fn.bind(_this, function () {
      if (player.tech_ && player.tech_.featuresNativeTextTracks) {
        this.hide();
        return;
      }

      player.on('fullscreenchange', Fn.bind(this, this.updateDisplay));

      var tracks = this.options_.playerOptions.tracks || [];

      for (var i = 0; i < tracks.length; i++) {
        this.player_.addRemoteTextTrack(tracks[i], true);
      }

      var modes = { captions: 1, subtitles: 1 };
      var trackList = this.player_.textTracks();
      var firstDesc = void 0;
      var firstCaptions = void 0;

      if (trackList) {
        for (var _i = 0; _i < trackList.length; _i++) {
          var track = trackList[_i];

          if (track['default']) {
            if (track.kind === 'descriptions' && !firstDesc) {
              firstDesc = track;
            } else if (track.kind in modes && !firstCaptions) {
              firstCaptions = track;
            }
          }
        }

        // We want to show the first default track but captions and subtitles
        // take precedence over descriptions.
        // So, display the first default captions or subtitles track
        // and otherwise the first default descriptions track.
        if (firstCaptions) {
          firstCaptions.mode = 'showing';
        } else if (firstDesc) {
          firstDesc.mode = 'showing';
        }
      }
    }));
    return _this;
  }

  /**
   * Turn display of {@link TextTrack}'s from the current state into the other state.
   * There are only two states:
   * - 'shown'
   * - 'hidden'
   *
   * @listens Player#loadstart
   */


  TextTrackDisplay.prototype.toggleDisplay = function toggleDisplay() {
    if (this.player_.tech_ && this.player_.tech_.featuresNativeTextTracks) {
      this.hide();
    } else {
      this.show();
    }
  };

  /**
   * Create the {@link Component}'s DOM element.
   *
   * @return {Element}
   *         The element that was created.
   */


  TextTrackDisplay.prototype.createEl = function createEl() {
    return _Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-text-track-display'
    }, {
      'aria-live': 'off',
      'aria-atomic': 'true'
    });
  };

  /**
   * Clear all displayed {@link TextTrack}s.
   */


  TextTrackDisplay.prototype.clearDisplay = function clearDisplay() {
    if (typeof _window2['default'].WebVTT === 'function') {
      _window2['default'].WebVTT.processCues(_window2['default'], [], this.el_);
    }
  };

  /**
   * Update the displayed TextTrack when a either a {@link Player#texttrackchange} or
   * a {@link Player#fullscreenchange} is fired.
   *
   * @listens Player#texttrackchange
   * @listens Player#fullscreenchange
   */


  TextTrackDisplay.prototype.updateDisplay = function updateDisplay() {
    var tracks = this.player_.textTracks();

    this.clearDisplay();

    if (!tracks) {
      return;
    }

    // Track display prioritization model: if multiple tracks are 'showing',
    //  display the first 'subtitles' or 'captions' track which is 'showing',
    //  otherwise display the first 'descriptions' track which is 'showing'

    var descriptionsTrack = null;
    var captionsSubtitlesTrack = null;

    var i = tracks.length;

    while (i--) {
      var track = tracks[i];

      if (track.mode === 'showing') {
        if (track.kind === 'descriptions') {
          descriptionsTrack = track;
        } else {
          captionsSubtitlesTrack = track;
        }
      }
    }

    if (captionsSubtitlesTrack) {
      if (this.getAttribute('aria-live') !== 'off') {
        this.setAttribute('aria-live', 'off');
      }
      this.updateForTrack(captionsSubtitlesTrack);
    } else if (descriptionsTrack) {
      if (this.getAttribute('aria-live') !== 'assertive') {
        this.setAttribute('aria-live', 'assertive');
      }
      this.updateForTrack(descriptionsTrack);
    }
  };

  /**
   * Add an {@link Texttrack} to to the {@link Tech}s {@link TextTrackList}.
   *
   * @param {TextTrack} track
   *        Text track object to be added to the list.
   */


  TextTrackDisplay.prototype.updateForTrack = function updateForTrack(track) {
    if (typeof _window2['default'].WebVTT !== 'function' || !track.activeCues) {
      return;
    }

    var overrides = this.player_.textTrackSettings.getValues();
    var cues = [];

    for (var _i2 = 0; _i2 < track.activeCues.length; _i2++) {
      cues.push(track.activeCues[_i2]);
    }

    _window2['default'].WebVTT.processCues(_window2['default'], cues, this.el_);

    var i = cues.length;

    while (i--) {
      var cue = cues[i];

      if (!cue) {
        continue;
      }

      var cueDiv = cue.displayState;

      if (overrides.color) {
        cueDiv.firstChild.style.color = overrides.color;
      }
      if (overrides.textOpacity) {
        tryUpdateStyle(cueDiv.firstChild, 'color', constructColor(overrides.color || '#fff', overrides.textOpacity));
      }
      if (overrides.backgroundColor) {
        cueDiv.firstChild.style.backgroundColor = overrides.backgroundColor;
      }
      if (overrides.backgroundOpacity) {
        tryUpdateStyle(cueDiv.firstChild, 'backgroundColor', constructColor(overrides.backgroundColor || '#000', overrides.backgroundOpacity));
      }
      if (overrides.windowColor) {
        if (overrides.windowOpacity) {
          tryUpdateStyle(cueDiv, 'backgroundColor', constructColor(overrides.windowColor, overrides.windowOpacity));
        } else {
          cueDiv.style.backgroundColor = overrides.windowColor;
        }
      }
      if (overrides.edgeStyle) {
        if (overrides.edgeStyle === 'dropshadow') {
          cueDiv.firstChild.style.textShadow = '2px 2px 3px ' + darkGray + ', 2px 2px 4px ' + darkGray + ', 2px 2px 5px ' + darkGray;
        } else if (overrides.edgeStyle === 'raised') {
          cueDiv.firstChild.style.textShadow = '1px 1px ' + darkGray + ', 2px 2px ' + darkGray + ', 3px 3px ' + darkGray;
        } else if (overrides.edgeStyle === 'depressed') {
          cueDiv.firstChild.style.textShadow = '1px 1px ' + lightGray + ', 0 1px ' + lightGray + ', -1px -1px ' + darkGray + ', 0 -1px ' + darkGray;
        } else if (overrides.edgeStyle === 'uniform') {
          cueDiv.firstChild.style.textShadow = '0 0 4px ' + darkGray + ', 0 0 4px ' + darkGray + ', 0 0 4px ' + darkGray + ', 0 0 4px ' + darkGray;
        }
      }
      if (overrides.fontPercent && overrides.fontPercent !== 1) {
        var fontSize = _window2['default'].parseFloat(cueDiv.style.fontSize);

        cueDiv.style.fontSize = fontSize * overrides.fontPercent + 'px';
        cueDiv.style.height = 'auto';
        cueDiv.style.top = 'auto';
        cueDiv.style.bottom = '2px';
      }
      if (overrides.fontFamily && overrides.fontFamily !== 'default') {
        if (overrides.fontFamily === 'small-caps') {
          cueDiv.firstChild.style.fontVariant = 'small-caps';
        } else {
          cueDiv.firstChild.style.fontFamily = fontMap[overrides.fontFamily];
        }
      }
    }
  };

  return TextTrackDisplay;
}(_component2['default']);

_component2['default'].registerComponent('TextTrackDisplay', TextTrackDisplay);
exports['default'] = TextTrackDisplay;
