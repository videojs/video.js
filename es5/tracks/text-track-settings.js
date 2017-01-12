'use strict';

exports.__esModule = true;

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

var _component = require('../component');

var _component2 = _interopRequireDefault(_component);

var _dom = require('../utils/dom');

var _fn = require('../utils/fn');

var Fn = _interopRequireWildcard(_fn);

var _obj = require('../utils/obj');

var Obj = _interopRequireWildcard(_obj);

var _log = require('../utils/log');

var _log2 = _interopRequireDefault(_log);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @file text-track-settings.js
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */


var LOCAL_STORAGE_KEY = 'vjs-text-track-settings';

var COLOR_BLACK = ['#000', 'Black'];
var COLOR_BLUE = ['#00F', 'Blue'];
var COLOR_CYAN = ['#0FF', 'Cyan'];
var COLOR_GREEN = ['#0F0', 'Green'];
var COLOR_MAGENTA = ['#F0F', 'Magenta'];
var COLOR_RED = ['#F00', 'Red'];
var COLOR_WHITE = ['#FFF', 'White'];
var COLOR_YELLOW = ['#FF0', 'Yellow'];

var OPACITY_OPAQUE = ['1', 'Opaque'];
var OPACITY_SEMI = ['0.5', 'Semi-Transparent'];
var OPACITY_TRANS = ['0', 'Transparent'];

// Configuration for the various <select> elements in the DOM of this component.
//
// Possible keys include:
//
// `default`:
//   The default option index. Only needs to be provided if not zero.
// `parser`:
//   A function which is used to parse the value from the selected option in
//   a customized way.
// `selector`:
//   The selector used to find the associated <select> element.
var selectConfigs = {
  backgroundColor: {
    selector: '.vjs-bg-color > select',
    id: 'captions-background-color-%s',
    label: 'Color',
    options: [COLOR_BLACK, COLOR_WHITE, COLOR_RED, COLOR_GREEN, COLOR_BLUE, COLOR_YELLOW, COLOR_MAGENTA, COLOR_CYAN]
  },

  backgroundOpacity: {
    selector: '.vjs-bg-opacity > select',
    id: 'captions-background-opacity-%s',
    label: 'Transparency',
    options: [OPACITY_OPAQUE, OPACITY_SEMI, OPACITY_TRANS]
  },

  color: {
    selector: '.vjs-fg-color > select',
    id: 'captions-foreground-color-%s',
    label: 'Color',
    options: [COLOR_WHITE, COLOR_BLACK, COLOR_RED, COLOR_GREEN, COLOR_BLUE, COLOR_YELLOW, COLOR_MAGENTA, COLOR_CYAN]
  },

  edgeStyle: {
    selector: '.vjs-edge-style > select',
    id: '%s',
    label: 'Text Edge Style',
    options: [['none', 'None'], ['raised', 'Raised'], ['depressed', 'Depressed'], ['uniform', 'Uniform'], ['dropshadow', 'Dropshadow']]
  },

  fontFamily: {
    selector: '.vjs-font-family > select',
    id: 'captions-font-family-%s',
    label: 'Font Family',
    options: [['proportionalSansSerif', 'Proportional Sans-Serif'], ['monospaceSansSerif', 'Monospace Sans-Serif'], ['proportionalSerif', 'Proportional Serif'], ['monospaceSerif', 'Monospace Serif'], ['casual', 'Casual'], ['script', 'Script'], ['small-caps', 'Small Caps']]
  },

  fontPercent: {
    selector: '.vjs-font-percent > select',
    id: 'captions-font-size-%s',
    label: 'Font Size',
    options: [['0.50', '50%'], ['0.75', '75%'], ['1.00', '100%'], ['1.25', '125%'], ['1.50', '150%'], ['1.75', '175%'], ['2.00', '200%'], ['3.00', '300%'], ['4.00', '400%']],
    'default': 2,
    parser: function parser(v) {
      return v === '1.00' ? null : Number(v);
    }
  },

  textOpacity: {
    selector: '.vjs-text-opacity > select',
    id: 'captions-foreground-opacity-%s',
    label: 'Transparency',
    options: [OPACITY_OPAQUE, OPACITY_SEMI]
  },

  // Options for this object are defined below.
  windowColor: {
    selector: '.vjs-window-color > select',
    id: 'captions-window-color-%s',
    label: 'Color'
  },

  // Options for this object are defined below.
  windowOpacity: {
    selector: '.vjs-window-opacity > select',
    id: 'captions-window-opacity-%s',
    label: 'Transparency',
    options: [OPACITY_TRANS, OPACITY_SEMI, OPACITY_OPAQUE]
  }
};

selectConfigs.windowColor.options = selectConfigs.backgroundColor.options;

/**
 * Get the actual value of an option.
 *
 * @param  {string} value
 *         The value to get
 *
 * @param  {Function} [parser]
 *         Optional function to adjust the value.
 *
 * @return {Mixed}
 *         - Will be `undefined` if no value exists
 *         - Will be `undefined` if the given value is "none".
 *         - Will be the actual value otherwise.
 *
 * @private
 */
function parseOptionValue(value, parser) {
  if (parser) {
    value = parser(value);
  }

  if (value && value !== 'none') {
    return value;
  }
}

/**
 * Gets the value of the selected <option> element within a <select> element.
 *
 * @param  {Element} el
 *         the element to look in
 *
 * @param  {Function} [parser]
 *         Optional function to adjust the value.
 *
 * @return {Mixed}
 *         - Will be `undefined` if no value exists
 *         - Will be `undefined` if the given value is "none".
 *         - Will be the actual value otherwise.
 *
 * @private
 */
function getSelectedOptionValue(el, parser) {
  var value = el.options[el.options.selectedIndex].value;

  return parseOptionValue(value, parser);
}

/**
 * Sets the selected <option> element within a <select> element based on a
 * given value.
 *
 * @param {Element} el
 *        The element to look in.
 *
 * @param {string} value
 *        the property to look on.
 *
 * @param {Function} [parser]
 *        Optional function to adjust the value before comparing.
 *
 * @private
 */
function setSelectedOption(el, value, parser) {
  if (!value) {
    return;
  }

  for (var i = 0; i < el.options.length; i++) {
    if (parseOptionValue(el.options[i].value, parser) === value) {
      el.selectedIndex = i;
      break;
    }
  }
}

/**
 * Manipulate Text Tracks settings.
 *
 * @extends Component
 */

var TextTrackSettings = function (_Component) {
  _inherits(TextTrackSettings, _Component);

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *         The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *         The key/value store of player options.
   */
  function TextTrackSettings(player, options) {
    _classCallCheck(this, TextTrackSettings);

    var _this = _possibleConstructorReturn(this, _Component.call(this, player, options));

    _this.setDefaults();
    _this.hide();

    _this.updateDisplay = Fn.bind(_this, _this.updateDisplay);

    // Grab `persistTextTrackSettings` from the player options if not passed in child options
    if (options.persistTextTrackSettings === undefined) {
      _this.options_.persistTextTrackSettings = _this.options_.playerOptions.persistTextTrackSettings;
    }

    _this.on(_this.$('.vjs-done-button'), 'click', function () {
      _this.saveSettings();
      _this.hide();
    });

    _this.on(_this.$('.vjs-default-button'), 'click', function () {
      _this.setDefaults();
      _this.updateDisplay();
    });

    Obj.each(selectConfigs, function (config) {
      _this.on(_this.$(config.selector), 'change', _this.updateDisplay);
    });

    if (_this.options_.persistTextTrackSettings) {
      _this.restoreSettings();
    }
    return _this;
  }

  /**
   * Create a <select> element with configured options.
   *
   * @param {string} key
   *        Configuration key to use during creation.
   *
   * @return {Element}
   *         The DOM element that gets created.
   * @private
   */


  TextTrackSettings.prototype.createElSelect_ = function createElSelect_(key) {
    var _this2 = this;

    var config = selectConfigs[key];
    var id = config.id.replace('%s', this.id_);

    return [(0, _dom.createEl)('label', {
      className: 'vjs-label',
      textContent: config.label
    }, {
      'for': id
    }), (0, _dom.createEl)('select', { id: id }, undefined, config.options.map(function (o) {
      return (0, _dom.createEl)('option', {
        textContent: _this2.localize(o[1]),
        value: o[0]
      });
    }))];
  };

  /**
   * Create foreground color element for the component
   *
   * @return {Element}
   *         The element that was created.
   *
   * @private
   */


  TextTrackSettings.prototype.createElFgColor_ = function createElFgColor_() {
    var legend = (0, _dom.createEl)('legend', {
      textContent: this.localize('Text')
    });

    var select = this.createElSelect_('color');

    var opacity = (0, _dom.createEl)('span', {
      className: 'vjs-text-opacity vjs-opacity'
    }, undefined, this.createElSelect_('textOpacity'));

    return (0, _dom.createEl)('fieldset', {
      className: 'vjs-fg-color vjs-tracksetting'
    }, undefined, [legend].concat(select, opacity));
  };

  /**
   * Create background color element for the component
   *
   * @return {Element}
   *         The element that was created
   *
   * @private
   */


  TextTrackSettings.prototype.createElBgColor_ = function createElBgColor_() {
    var legend = (0, _dom.createEl)('legend', {
      textContent: this.localize('Background')
    });

    var select = this.createElSelect_('backgroundColor');

    var opacity = (0, _dom.createEl)('span', {
      className: 'vjs-bg-opacity vjs-opacity'
    }, undefined, this.createElSelect_('backgroundOpacity'));

    return (0, _dom.createEl)('fieldset', {
      className: 'vjs-bg-color vjs-tracksetting'
    }, undefined, [legend].concat(select, opacity));
  };

  /**
   * Create window color element for the component
   *
   * @return {Element}
   *         The element that was created
   *
   * @private
   */


  TextTrackSettings.prototype.createElWinColor_ = function createElWinColor_() {
    var legend = (0, _dom.createEl)('legend', {
      textContent: this.localize('Window')
    });

    var select = this.createElSelect_('windowColor');

    var opacity = (0, _dom.createEl)('span', {
      className: 'vjs-window-opacity vjs-opacity'
    }, undefined, this.createElSelect_('windowOpacity'));

    return (0, _dom.createEl)('fieldset', {
      className: 'vjs-window-color vjs-tracksetting'
    }, undefined, [legend].concat(select, opacity));
  };

  /**
   * Create color elements for the component
   *
   * @return {Element}
   *         The element that was created
   *
   * @private
   */


  TextTrackSettings.prototype.createElColors_ = function createElColors_() {
    return (0, _dom.createEl)('div', {
      className: 'vjs-tracksettings-colors'
    }, undefined, [this.createElFgColor_(), this.createElBgColor_(), this.createElWinColor_()]);
  };

  /**
   * Create font elements for the component
   *
   * @return {Element}
   *         The element that was created.
   *
   * @private
   */


  TextTrackSettings.prototype.createElFont_ = function createElFont_() {
    var fontPercent = (0, _dom.createEl)('div', {
      className: 'vjs-font-percent vjs-tracksetting'
    }, undefined, this.createElSelect_('fontPercent'));

    var edgeStyle = (0, _dom.createEl)('div', {
      className: 'vjs-edge-style vjs-tracksetting'
    }, undefined, this.createElSelect_('edgeStyle'));

    var fontFamily = (0, _dom.createEl)('div', {
      className: 'vjs-font-family vjs-tracksetting'
    }, undefined, this.createElSelect_('fontFamily'));

    return (0, _dom.createEl)('div', {
      className: 'vjs-tracksettings-font'
    }, undefined, [fontPercent, edgeStyle, fontFamily]);
  };

  /**
   * Create controls for the component
   *
   * @return {Element}
   *         The element that was created.
   *
   * @private
   */


  TextTrackSettings.prototype.createElControls_ = function createElControls_() {
    var defaultsButton = (0, _dom.createEl)('button', {
      className: 'vjs-default-button',
      textContent: this.localize('Defaults')
    });

    var doneButton = (0, _dom.createEl)('button', {
      className: 'vjs-done-button',
      textContent: 'Done'
    });

    return (0, _dom.createEl)('div', {
      className: 'vjs-tracksettings-controls'
    }, undefined, [defaultsButton, doneButton]);
  };

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   *         The element that was created.
   */


  TextTrackSettings.prototype.createEl = function createEl() {
    var settings = (0, _dom.createEl)('div', {
      className: 'vjs-tracksettings'
    }, undefined, [this.createElColors_(), this.createElFont_(), this.createElControls_()]);

    var heading = (0, _dom.createEl)('div', {
      className: 'vjs-control-text',
      id: 'TTsettingsDialogLabel-' + this.id_,
      textContent: 'Caption Settings Dialog'
    }, {
      'aria-level': '1',
      'role': 'heading'
    });

    var description = (0, _dom.createEl)('div', {
      className: 'vjs-control-text',
      id: 'TTsettingsDialogDescription-' + this.id_,
      textContent: 'Beginning of dialog window. Escape will cancel and close the window.'
    });

    var doc = (0, _dom.createEl)('div', undefined, {
      role: 'document'
    }, [heading, description, settings]);

    return (0, _dom.createEl)('div', {
      className: 'vjs-caption-settings vjs-modal-overlay',
      tabIndex: -1
    }, {
      'role': 'dialog',
      'aria-labelledby': heading.id,
      'aria-describedby': description.id
    }, doc);
  };

  /**
   * Gets an object of text track settings (or null).
   *
   * @return {Object}
   *         An object with config values parsed from the DOM or localStorage.
   */


  TextTrackSettings.prototype.getValues = function getValues() {
    var _this3 = this;

    return Obj.reduce(selectConfigs, function (accum, config, key) {
      var value = getSelectedOptionValue(_this3.$(config.selector), config.parser);

      if (value !== undefined) {
        accum[key] = value;
      }

      return accum;
    }, {});
  };

  /**
   * Sets text track settings from an object of values.
   *
   * @param {Object} values
   *        An object with config values parsed from the DOM or localStorage.
   */


  TextTrackSettings.prototype.setValues = function setValues(values) {
    var _this4 = this;

    Obj.each(selectConfigs, function (config, key) {
      setSelectedOption(_this4.$(config.selector), values[key], config.parser);
    });
  };

  /**
   * Sets all <select> elements to their default values.
   */


  TextTrackSettings.prototype.setDefaults = function setDefaults() {
    var _this5 = this;

    Obj.each(selectConfigs, function (config) {
      var index = config.hasOwnProperty('default') ? config['default'] : 0;

      _this5.$(config.selector).selectedIndex = index;
    });
  };

  /**
   * Restore texttrack settings from localStorage
   */


  TextTrackSettings.prototype.restoreSettings = function restoreSettings() {
    var values = void 0;

    try {
      values = JSON.parse(_window2['default'].localStorage.getItem(LOCAL_STORAGE_KEY));
    } catch (err) {
      _log2['default'].warn(err);
    }

    if (values) {
      this.setValues(values);
    }
  };

  /**
   * Save text track settings to localStorage
   */


  TextTrackSettings.prototype.saveSettings = function saveSettings() {
    if (!this.options_.persistTextTrackSettings) {
      return;
    }

    var values = this.getValues();

    try {
      if (Object.keys(values).length) {
        _window2['default'].localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(values));
      } else {
        _window2['default'].localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (err) {
      _log2['default'].warn(err);
    }
  };

  /**
   * Update display of text track settings
   */


  TextTrackSettings.prototype.updateDisplay = function updateDisplay() {
    var ttDisplay = this.player_.getChild('textTrackDisplay');

    if (ttDisplay) {
      ttDisplay.updateDisplay();
    }
  };

  return TextTrackSettings;
}(_component2['default']);

_component2['default'].registerComponent('TextTrackSettings', TextTrackSettings);

exports['default'] = TextTrackSettings;
