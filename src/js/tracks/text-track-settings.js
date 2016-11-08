/**
 * @file text-track-settings.js
 */
import window from 'global/window';
import Component from '../component';
import {createEl} from '../utils/dom';
import * as Fn from '../utils/fn';
import * as Obj from '../utils/obj';
import log from '../utils/log';

const LOCAL_STORAGE_KEY = 'vjs-text-track-settings';

const COLOR_BLACK = ['#000', 'Black'];
const COLOR_BLUE = ['#00F', 'Blue'];
const COLOR_CYAN = ['#0FF', 'Cyan'];
const COLOR_GREEN = ['#0F0', 'Green'];
const COLOR_MAGENTA = ['#F0F', 'Magenta'];
const COLOR_RED = ['#F00', 'Red'];
const COLOR_WHITE = ['#FFF', 'White'];
const COLOR_YELLOW = ['#FF0', 'Yellow'];

const OPACITY_OPAQUE = ['1', 'Opaque'];
const OPACITY_SEMI = ['0.5', 'Semi-Transparent'];
const OPACITY_TRANS = ['0', 'Transparent'];

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
const selectConfigs = {
  backgroundColor: {
    selector: '.vjs-bg-color > select',
    id: 'captions-background-color-%s',
    label: 'Color',
    options: [
      COLOR_BLACK,
      COLOR_WHITE,
      COLOR_RED,
      COLOR_GREEN,
      COLOR_BLUE,
      COLOR_YELLOW,
      COLOR_MAGENTA,
      COLOR_CYAN
    ]
  },

  backgroundOpacity: {
    selector: '.vjs-bg-opacity > select',
    id: 'captions-background-opacity-%s',
    label: 'Transparency',
    options: [
      OPACITY_OPAQUE,
      OPACITY_SEMI,
      OPACITY_TRANS
    ]
  },

  color: {
    selector: '.vjs-fg-color > select',
    id: 'captions-foreground-color-%s',
    label: 'Color',
    options: [
      COLOR_WHITE,
      COLOR_BLACK,
      COLOR_RED,
      COLOR_GREEN,
      COLOR_BLUE,
      COLOR_YELLOW,
      COLOR_MAGENTA,
      COLOR_CYAN
    ]
  },

  edgeStyle: {
    selector: '.vjs-edge-style > select',
    id: '%s',
    label: 'Text Edge Style',
    options: [
      ['none', 'None'],
      ['raised', 'Raised'],
      ['depressed', 'Depressed'],
      ['uniform', 'Uniform'],
      ['dropshadow', 'Dropshadow']
    ]
  },

  fontFamily: {
    selector: '.vjs-font-family > select',
    id: 'captions-font-family-%s',
    label: 'Font Family',
    options: [
      ['proportionalSansSerif', 'Proportional Sans-Serif'],
      ['monospaceSansSerif', 'Monospace Sans-Serif'],
      ['proportionalSerif', 'Proportional Serif'],
      ['monospaceSerif', 'Monospace Serif'],
      ['casual', 'Casual'],
      ['script', 'Script'],
      ['small-caps', 'Small Caps']
    ]
  },

  fontPercent: {
    selector: '.vjs-font-percent > select',
    id: 'captions-font-size-%s',
    label: 'Font Size',
    options: [
      ['0.50', '50%'],
      ['0.75', '75%'],
      ['1.00', '100%'],
      ['1.25', '125%'],
      ['1.50', '150%'],
      ['1.75', '175%'],
      ['2.00', '200%'],
      ['3.00', '300%'],
      ['4.00', '400%']
    ],
    default: 2,
    parser: (v) => v === '1.00' ? null : Number(v)
  },

  textOpacity: {
    selector: '.vjs-text-opacity > select',
    id: 'captions-foreground-opacity-%s',
    label: 'Transparency',
    options: [
      OPACITY_OPAQUE,
      OPACITY_SEMI
    ]
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
    options: [
      OPACITY_TRANS,
      OPACITY_SEMI,
      OPACITY_OPAQUE
    ]
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
  const value = el.options[el.options.selectedIndex].value;

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

  for (let i = 0; i < el.options.length; i++) {
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
class TextTrackSettings extends Component {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *         The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *         The key/value store of player options.
   */
  constructor(player, options) {
    super(player, options);
    this.setDefaults();
    this.hide();

    this.updateDisplay = Fn.bind(this, this.updateDisplay);

    // Grab `persistTextTrackSettings` from the player options if not passed in child options
    if (options.persistTextTrackSettings === undefined) {
      this.options_.persistTextTrackSettings = this.options_.playerOptions.persistTextTrackSettings;
    }

    this.on(this.$('.vjs-done-button'), 'click', () => {
      this.saveSettings();
      this.hide();
    });

    this.on(this.$('.vjs-default-button'), 'click', () => {
      this.setDefaults();
      this.updateDisplay();
    });

    Obj.each(selectConfigs, config => {
      this.on(this.$(config.selector), 'change', this.updateDisplay);
    });

    if (this.options_.persistTextTrackSettings) {
      this.restoreSettings();
    }
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
  createElSelect_(key) {
    const config = selectConfigs[key];
    const id = config.id.replace('%s', this.id_);

    return [
      createEl('label', {
        className: 'vjs-label',
        textContent: config.label
      }, {
        for: id
      }),
      createEl('select', {id}, undefined, config.options.map(o => {
        return createEl('option', {
          textContent: this.localize(o[1]),
          value: o[0]
        });
      }))
    ];
  }

  /**
   * Create foreground color element for the component
   *
   * @return {Element}
   *         The element that was created.
   *
   * @private
   */
  createElFgColor_() {
    const legend = createEl('legend', {
      textContent: this.localize('Text')
    });

    const select = this.createElSelect_('color');

    const opacity = createEl('span', {
      className: 'vjs-text-opacity vjs-opacity'
    }, undefined, this.createElSelect_('textOpacity'));

    return createEl('fieldset', {
      className: 'vjs-fg-color vjs-tracksetting'
    }, undefined, [legend].concat(select, opacity));
  }

  /**
   * Create background color element for the component
   *
   * @return {Element}
   *         The element that was created
   *
   * @private
   */
  createElBgColor_() {
    const legend = createEl('legend', {
      textContent: this.localize('Background')
    });

    const select = this.createElSelect_('backgroundColor');

    const opacity = createEl('span', {
      className: 'vjs-bg-opacity vjs-opacity'
    }, undefined, this.createElSelect_('backgroundOpacity'));

    return createEl('fieldset', {
      className: 'vjs-bg-color vjs-tracksetting'
    }, undefined, [legend].concat(select, opacity));
  }

  /**
   * Create window color element for the component
   *
   * @return {Element}
   *         The element that was created
   *
   * @private
   */
  createElWinColor_() {
    const legend = createEl('legend', {
      textContent: this.localize('Window')
    });

    const select = this.createElSelect_('windowColor');

    const opacity = createEl('span', {
      className: 'vjs-window-opacity vjs-opacity'
    }, undefined, this.createElSelect_('windowOpacity'));

    return createEl('fieldset', {
      className: 'vjs-window-color vjs-tracksetting'
    }, undefined, [legend].concat(select, opacity));
  }

  /**
   * Create color elements for the component
   *
   * @return {Element}
   *         The element that was created
   *
   * @private
   */
  createElColors_() {
    return createEl('div', {
      className: 'vjs-tracksettings-colors'
    }, undefined, [
      this.createElFgColor_(),
      this.createElBgColor_(),
      this.createElWinColor_()
    ]);
  }

  /**
   * Create font elements for the component
   *
   * @return {Element}
   *         The element that was created.
   *
   * @private
   */
  createElFont_() {
    const fontPercent = createEl('div', {
      className: 'vjs-font-percent vjs-tracksetting'
    }, undefined, this.createElSelect_('fontPercent'));

    const edgeStyle = createEl('div', {
      className: 'vjs-edge-style vjs-tracksetting'
    }, undefined, this.createElSelect_('edgeStyle'));

    const fontFamily = createEl('div', {
      className: 'vjs-font-family vjs-tracksetting'
    }, undefined, this.createElSelect_('fontFamily'));

    return createEl('div', {
      className: 'vjs-tracksettings-font'
    }, undefined, [fontPercent, edgeStyle, fontFamily]);
  }

  /**
   * Create controls for the component
   *
   * @return {Element}
   *         The element that was created.
   *
   * @private
   */
  createElControls_() {
    const defaultsButton = createEl('button', {
      className: 'vjs-default-button',
      textContent: this.localize('Defaults')
    });

    const doneButton = createEl('button', {
      className: 'vjs-done-button',
      textContent: 'Done'
    });

    return createEl('div', {
      className: 'vjs-tracksettings-controls'
    }, undefined, [defaultsButton, doneButton]);
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    const settings = createEl('div', {
      className: 'vjs-tracksettings'
    }, undefined, [
      this.createElColors_(),
      this.createElFont_(),
      this.createElControls_()
    ]);

    const heading = createEl('div', {
      className: 'vjs-control-text',
      id: `TTsettingsDialogLabel-${this.id_}`,
      textContent: 'Caption Settings Dialog'
    }, {
      'aria-level': '1',
      'role': 'heading'
    });

    const description = createEl('div', {
      className: 'vjs-control-text',
      id: `TTsettingsDialogDescription-${this.id_}`,
      textContent: 'Beginning of dialog window. Escape will cancel and close the window.'
    });

    const doc = createEl('div', undefined, {
      role: 'document'
    }, [heading, description, settings]);

    return createEl('div', {
      className: 'vjs-caption-settings vjs-modal-overlay',
      tabIndex: -1
    }, {
      'role': 'dialog',
      'aria-labelledby': heading.id,
      'aria-describedby': description.id
    }, doc);
  }

  /**
   * Gets an object of text track settings (or null).
   *
   * @return {Object}
   *         An object with config values parsed from the DOM or localStorage.
   */
  getValues() {
    return Obj.reduce(selectConfigs, (accum, config, key) => {
      const value = getSelectedOptionValue(this.$(config.selector), config.parser);

      if (value !== undefined) {
        accum[key] = value;
      }

      return accum;
    }, {});
  }

  /**
   * Sets text track settings from an object of values.
   *
   * @param {Object} values
   *        An object with config values parsed from the DOM or localStorage.
   */
  setValues(values) {
    Obj.each(selectConfigs, (config, key) => {
      setSelectedOption(this.$(config.selector), values[key], config.parser);
    });
  }

  /**
   * Sets all <select> elements to their default values.
   */
  setDefaults() {
    Obj.each(selectConfigs, (config) => {
      const index = config.hasOwnProperty('default') ? config.default : 0;

      this.$(config.selector).selectedIndex = index;
    });
  }

  /**
   * Restore texttrack settings from localStorage
   */
  restoreSettings() {
    let values;

    try {
      values = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY));
    } catch (err) {
      log.warn(err);
    }

    if (values) {
      this.setValues(values);
    }
  }

  /**
   * Save text track settings to localStorage
   */
  saveSettings() {
    if (!this.options_.persistTextTrackSettings) {
      return;
    }

    const values = this.getValues();

    try {
      if (Object.keys(values).length) {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(values));
      } else {
        window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (err) {
      log.warn(err);
    }
  }

  /**
   * Update display of text track settings
   */
  updateDisplay() {
    const ttDisplay = this.player_.getChild('textTrackDisplay');

    if (ttDisplay) {
      ttDisplay.updateDisplay();
    }
  }

}

Component.registerComponent('TextTrackSettings', TextTrackSettings);

export default TextTrackSettings;
