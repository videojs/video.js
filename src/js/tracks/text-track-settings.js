/**
 * @file text-track-settings.js
 */
import Component from '../component';
import * as Events from '../utils/events.js';
import * as Fn from '../utils/fn.js';
import log from '../utils/log.js';
import safeParseTuple from 'safe-json-parse/tuple';
import window from 'global/window';

const darkGray = '#222';
const lightGray = '#ccc';
const fontMap = {
  monospace:             'monospace',
  sansSerif:             'sans-serif',
  serif:                 'serif',
  monospaceSansSerif:    '"Andale Mono", "Lucida Console", monospace',
  monospaceSerif:        '"Courier New", monospace',
  proportionalSansSerif: 'sans-serif',
  proportionalSerif:     'serif',
  casual:                '"Comic Sans MS", Impact, fantasy',
  script:                '"Monotype Corsiva", cursive',
  smallcaps:             '"Andale Mono", "Lucida Console", monospace, sans-serif'
};

/**
 * Manipulate settings of texttracks
 *
 * @param {Object} player  Main Player
 * @param {Object=} options Object of option names and values
 * @extends Component
 * @class TextTrackSettings
 */
class TextTrackSettings extends Component {

  constructor(player, options) {
    super(player, options);
    this.hide();

    // Grab `persistTextTrackSettings` from the player options if not passed in child options
    if (options.persistTextTrackSettings === undefined) {
      this.options_.persistTextTrackSettings = this.options_.playerOptions.persistTextTrackSettings;
    }

    Events.on(this.$('.vjs-done-button'), 'click', Fn.bind(this, function() {
      this.saveSettings();
      this.hide();
    }));

    Events.on(this.$('.vjs-default-button'), 'click', Fn.bind(this, function() {
      this.$('.vjs-fg-color > select').selectedIndex = 0;
      this.$('.vjs-bg-color > select').selectedIndex = 0;
      this.$('.window-color > select').selectedIndex = 0;
      this.$('.vjs-text-opacity > select').selectedIndex = 0;
      this.$('.vjs-bg-opacity > select').selectedIndex = 0;
      this.$('.vjs-window-opacity > select').selectedIndex = 0;
      this.$('.vjs-edge-style select').selectedIndex = 0;
      this.$('.vjs-font-family select').selectedIndex = 0;
      this.$('.vjs-font-percent select').selectedIndex = 2;
      this.updateDisplay();
    }));

    Events.on(this.$('.vjs-fg-color > select'), 'change', Fn.bind(this, this.updateDisplay));
    Events.on(this.$('.vjs-bg-color > select'), 'change', Fn.bind(this, this.updateDisplay));
    Events.on(this.$('.window-color > select'), 'change', Fn.bind(this, this.updateDisplay));
    Events.on(this.$('.vjs-text-opacity > select'), 'change', Fn.bind(this, this.updateDisplay));
    Events.on(this.$('.vjs-bg-opacity > select'), 'change', Fn.bind(this, this.updateDisplay));
    Events.on(this.$('.vjs-window-opacity > select'), 'change', Fn.bind(this, this.updateDisplay));
    Events.on(this.$('.vjs-font-percent select'), 'change', Fn.bind(this, this.updateDisplay));
    Events.on(this.$('.vjs-edge-style select'), 'change', Fn.bind(this, this.updateDisplay));
    Events.on(this.$('.vjs-font-family select'), 'change', Fn.bind(this, this.updateDisplay));

    if (this.options_.persistTextTrackSettings) {
      this.restoreSettings();
    }
  }

  /**
   * Create the component's DOM element
   *
   * @return {Element}
   * @method createEl
   */
  createEl() {
    return super.createEl('div', {
      className: 'vjs-caption-settings vjs-modal-overlay',
      innerHTML: captionOptionsMenuTemplate()
    });
  }

  /**
   * Get texttrack settings
   * Settings are
   * .vjs-edge-style
   * .vjs-font-family
   * .vjs-fg-color
   * .vjs-text-opacity
   * .vjs-bg-color
   * .vjs-bg-opacity
   * .window-color
   * .vjs-window-opacity
   *
   * @return {Object}
   * @method getValues
   */
  getValues() {
    const textEdge = getSelectedOptionValue(this.$('.vjs-edge-style select'));
    const fontFamily = getSelectedOptionValue(this.$('.vjs-font-family select'));
    const fgColor = getSelectedOptionValue(this.$('.vjs-fg-color > select'));
    const textOpacity = getSelectedOptionValue(this.$('.vjs-text-opacity > select'));
    const bgColor = getSelectedOptionValue(this.$('.vjs-bg-color > select'));
    const bgOpacity = getSelectedOptionValue(this.$('.vjs-bg-opacity > select'));
    const windowColor = getSelectedOptionValue(this.$('.window-color > select'));
    const windowOpacity = getSelectedOptionValue(this.$('.vjs-window-opacity > select'));
    const fontPercent = window['parseFloat'](getSelectedOptionValue(this.$('.vjs-font-percent > select')));

    let result = {
      'backgroundOpacity': bgOpacity,
      'textOpacity': textOpacity,
      'windowOpacity': windowOpacity,
      'edgeStyle': textEdge,
      'fontFamily': fontFamily,
      'color': fgColor,
      'backgroundColor': bgColor,
      'windowColor': windowColor,
      'fontPercent': fontPercent
    };
    for (let name in result) {
      if (result[name] === '' || result[name] === 'none' || (name === 'fontPercent' && result[name] === 1.00)) {
        delete result[name];
      }
    }
    return result;
  }

  /**
   * Set texttrack settings
   * Settings are
   * .vjs-edge-style
   * .vjs-font-family
   * .vjs-fg-color
   * .vjs-text-opacity
   * .vjs-bg-color
   * .vjs-bg-opacity
   * .window-color
   * .vjs-window-opacity
   *
   * @param {Object} values Object with texttrack setting values
   * @method setValues
   */
  setValues(values) {
    setSelectedOption(this.$('.vjs-edge-style select'), values.edgeStyle);
    setSelectedOption(this.$('.vjs-font-family select'), values.fontFamily);
    setSelectedOption(this.$('.vjs-fg-color > select'), values.color);
    setSelectedOption(this.$('.vjs-text-opacity > select'), values.textOpacity);
    setSelectedOption(this.$('.vjs-bg-color > select'), values.backgroundColor);
    setSelectedOption(this.$('.vjs-bg-opacity > select'), values.backgroundOpacity);
    setSelectedOption(this.$('.window-color > select'), values.windowColor);
    setSelectedOption(this.$('.vjs-window-opacity > select'), values.windowOpacity);

    let fontPercent = values.fontPercent;

    if (fontPercent) {
      fontPercent = fontPercent.toFixed(2);
    }

    setSelectedOption(this.$('.vjs-font-percent > select'), fontPercent);
  }

  /**
   * Restore texttrack settings
   *
   * @method restoreSettings
   */
  restoreSettings() {
    let [err, values] = safeParseTuple(window.localStorage.getItem('vjs-text-track-settings'));

    if (err) {
      log.error(err);
    }

    if (values) {
      this.setValues(values);
    }
  }

  /**
   * Save texttrack settings to local storage
   *
   * @method saveSettings
   */
  saveSettings() {
    if (!this.options_.persistTextTrackSettings) {
      return;
    }

    let values = this.getValues();
    try {
      if (Object.getOwnPropertyNames(values).length > 0) {
        window.localStorage.setItem('vjs-text-track-settings', JSON.stringify(values));
      } else {
        window.localStorage.removeItem('vjs-text-track-settings');
      }
    } catch (e) {}
  }

  /**
   * Update display of texttrack settings
   *
   * @method updateDisplay
   */
  updateDisplay() {
    let ttDisplay = this.player_.getChild('textTrackDisplay');
    if (ttDisplay) {
      ttDisplay.updateDisplay();
    }
  }


  /**
   * Apply textTrackSettings to cues
   *
   * @method applyUserSettings
   */
  applyUserSettings(cues) {

    let overrides = this.getValues();

    let i = cues.length;
    while (i--) {
      let cue = cues[i];
      if (!cue) {
        continue;
      }

      let cueDiv = cue.displayState;
      if (overrides.color) {
        cueDiv.firstChild.style.color = overrides.color;
      }
      if (overrides.textOpacity) {
        tryUpdateStyle(cueDiv.firstChild,
                       'color',
                       constructColor(overrides.color || '#fff',
                                      overrides.textOpacity));
      }
      if (overrides.backgroundColor) {
        cueDiv.firstChild.style.backgroundColor = overrides.backgroundColor;
      }
      if (overrides.backgroundOpacity) {
        tryUpdateStyle(cueDiv.firstChild,
                       'backgroundColor',
                       constructColor(overrides.backgroundColor || '#000',
                                      overrides.backgroundOpacity));
      }
      if (overrides.windowColor) {
        if (overrides.windowOpacity) {
          tryUpdateStyle(cueDiv,
                         'backgroundColor',
                         constructColor(overrides.windowColor, overrides.windowOpacity));
        } else {
          cueDiv.style.backgroundColor = overrides.windowColor;
        }
      }
      if (overrides.edgeStyle) {
        if (overrides.edgeStyle === 'dropshadow') {
          cueDiv.firstChild.style.textShadow = `2px 2px 3px ${darkGray}, 2px 2px 4px ${darkGray}, 2px 2px 5px ${darkGray}`;
        } else if (overrides.edgeStyle === 'raised') {
          cueDiv.firstChild.style.textShadow = `1px 1px ${darkGray}, 2px 2px ${darkGray}, 3px 3px ${darkGray}`;
        } else if (overrides.edgeStyle === 'depressed') {
          cueDiv.firstChild.style.textShadow = `1px 1px ${lightGray}, 0 1px ${lightGray}, -1px -1px ${darkGray}, 0 -1px ${darkGray}`;
        } else if (overrides.edgeStyle === 'uniform') {
          cueDiv.firstChild.style.textShadow = `0 0 4px ${darkGray}, 0 0 4px ${darkGray}, 0 0 4px ${darkGray}, 0 0 4px ${darkGray}`;
        }
      }
      if (overrides.fontPercent && overrides.fontPercent !== 1) {
        const fontSize = window.parseFloat(cueDiv.style.fontSize);
        cueDiv.style.fontSize = (fontSize * overrides.fontPercent) + 'px';
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
  }
}

Component.registerComponent('TextTrackSettings', TextTrackSettings);

function getSelectedOptionValue(target) {
  let selectedOption;
  // not all browsers support selectedOptions, so, fallback to options
  if (target.selectedOptions) {
    selectedOption = target.selectedOptions[0];
  } else if (target.options) {
    selectedOption = target.options[target.options.selectedIndex];
  }

  return selectedOption.value;
}

function setSelectedOption(target, value) {
  if (!value) {
    return;
  }

  let i;
  for (i = 0; i < target.options.length; i++) {
    const option = target.options[i];
    if (option.value === value) {
      break;
    }
  }

  target.selectedIndex = i;
}

/**
* Add cue HTML to display
*
* @param {Number} color Hex number for color, like #f0e
* @param {Number} opacity Value for opacity,0.0 - 1.0
* @return {RGBAColor} In the form 'rgba(255, 0, 0, 0.3)'
* @method constructColor
*/
function constructColor(color, opacity) {
  return 'rgba(' +
    // color looks like "#f0e"
    parseInt(color[1] + color[1], 16) + ',' +
    parseInt(color[2] + color[2], 16) + ',' +
    parseInt(color[3] + color[3], 16) + ',' +
    opacity + ')';
}

/**
 * Try to update style
 * Some style changes will throw an error, particularly in IE8. Those should be noops.
 *
 * @param {Element} el The element to be styles
 * @param {CSSProperty} style The CSS property to be styled
 * @param {CSSStyle} rule The actual style to be applied to the property
 * @method tryUpdateStyle
 */
function tryUpdateStyle(el, style, rule) {
  //
  try {
    el.style[style] = rule;
  } catch (e) {}
}

function captionOptionsMenuTemplate() {
  let template = `<div class="vjs-tracksettings">
      <div class="vjs-tracksettings-colors">
        <div class="vjs-fg-color vjs-tracksetting">
            <label class="vjs-label">Foreground</label>
            <select>
              <option value="">---</option>
              <option value="#FFF">White</option>
              <option value="#000">Black</option>
              <option value="#F00">Red</option>
              <option value="#0F0">Green</option>
              <option value="#00F">Blue</option>
              <option value="#FF0">Yellow</option>
              <option value="#F0F">Magenta</option>
              <option value="#0FF">Cyan</option>
            </select>
            <span class="vjs-text-opacity vjs-opacity">
              <select>
                <option value="">---</option>
                <option value="1">Opaque</option>
                <option value="0.5">Semi-Opaque</option>
              </select>
            </span>
        </div> <!-- vjs-fg-color -->
        <div class="vjs-bg-color vjs-tracksetting">
            <label class="vjs-label">Background</label>
            <select>
              <option value="">---</option>
              <option value="#FFF">White</option>
              <option value="#000">Black</option>
              <option value="#F00">Red</option>
              <option value="#0F0">Green</option>
              <option value="#00F">Blue</option>
              <option value="#FF0">Yellow</option>
              <option value="#F0F">Magenta</option>
              <option value="#0FF">Cyan</option>
            </select>
            <span class="vjs-bg-opacity vjs-opacity">
                <select>
                  <option value="">---</option>
                  <option value="1">Opaque</option>
                  <option value="0.5">Semi-Transparent</option>
                  <option value="0">Transparent</option>
                </select>
            </span>
        </div> <!-- vjs-bg-color -->
        <div class="window-color vjs-tracksetting">
            <label class="vjs-label">Window</label>
            <select>
              <option value="">---</option>
              <option value="#FFF">White</option>
              <option value="#000">Black</option>
              <option value="#F00">Red</option>
              <option value="#0F0">Green</option>
              <option value="#00F">Blue</option>
              <option value="#FF0">Yellow</option>
              <option value="#F0F">Magenta</option>
              <option value="#0FF">Cyan</option>
            </select>
            <span class="vjs-window-opacity vjs-opacity">
                <select>
                  <option value="">---</option>
                  <option value="1">Opaque</option>
                  <option value="0.5">Semi-Transparent</option>
                  <option value="0">Transparent</option>
                </select>
            </span>
        </div> <!-- vjs-window-color -->
      </div> <!-- vjs-tracksettings -->
      <div class="vjs-tracksettings-font">
        <div class="vjs-font-percent vjs-tracksetting">
          <label class="vjs-label">Font Size</label>
          <select>
            <option value="0.50">50%</option>
            <option value="0.75">75%</option>
            <option value="1.00" selected>100%</option>
            <option value="1.25">125%</option>
            <option value="1.50">150%</option>
            <option value="1.75">175%</option>
            <option value="2.00">200%</option>
            <option value="3.00">300%</option>
            <option value="4.00">400%</option>
          </select>
        </div> <!-- vjs-font-percent -->
        <div class="vjs-edge-style vjs-tracksetting">
          <label class="vjs-label">Text Edge Style</label>
          <select>
            <option value="none">None</option>
            <option value="raised">Raised</option>
            <option value="depressed">Depressed</option>
            <option value="uniform">Uniform</option>
            <option value="dropshadow">Dropshadow</option>
          </select>
        </div> <!-- vjs-edge-style -->
        <div class="vjs-font-family vjs-tracksetting">
          <label class="vjs-label">Font Family</label>
          <select>
            <option value="">Default</option>
            <option value="monospaceSerif">Monospace Serif</option>
            <option value="proportionalSerif">Proportional Serif</option>
            <option value="monospaceSansSerif">Monospace Sans-Serif</option>
            <option value="proportionalSansSerif">Proportional Sans-Serif</option>
            <option value="casual">Casual</option>
            <option value="script">Script</option>
            <option value="small-caps">Small Caps</option>
          </select>
        </div> <!-- vjs-font-family -->
      </div>
    </div>
    <div class="vjs-tracksettings-controls">
      <button class="vjs-default-button">Defaults</button>
      <button class="vjs-done-button">Done</button>
    </div>`;

    return template;
}

export default TextTrackSettings;
