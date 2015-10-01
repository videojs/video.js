/**
 * @file text-track-settings.js
 */
import Component from '../component';
import * as Events from '../utils/events.js';
import * as Fn from '../utils/fn.js';
import log from '../utils/log.js';
import safeParseTuple from 'safe-json-parse/tuple';
import window from 'global/window';

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

    Events.on(this.el().querySelector('.vjs-done-button'), 'click', Fn.bind(this, function() {
      this.saveSettings();
      this.hide();
    }));

    Events.on(this.el().querySelector('.vjs-default-button'), 'click', Fn.bind(this, function() {
      this.el().querySelector('.vjs-fg-color > select').selectedIndex = 0;
      this.el().querySelector('.vjs-bg-color > select').selectedIndex = 0;
      this.el().querySelector('.window-color > select').selectedIndex = 0;
      this.el().querySelector('.vjs-text-opacity > select').selectedIndex = 0;
      this.el().querySelector('.vjs-bg-opacity > select').selectedIndex = 0;
      this.el().querySelector('.vjs-window-opacity > select').selectedIndex = 0;
      this.el().querySelector('.vjs-edge-style select').selectedIndex = 0;
      this.el().querySelector('.vjs-font-family select').selectedIndex = 0;
      this.el().querySelector('.vjs-font-percent select').selectedIndex = 2;
      this.updateDisplay();
    }));

    Events.on(this.el().querySelector('.vjs-fg-color > select'), 'change', Fn.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-bg-color > select'), 'change', Fn.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.window-color > select'), 'change', Fn.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-text-opacity > select'), 'change', Fn.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-bg-opacity > select'), 'change', Fn.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-window-opacity > select'), 'change', Fn.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-font-percent select'), 'change', Fn.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-edge-style select'), 'change', Fn.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-font-family select'), 'change', Fn.bind(this, this.updateDisplay));

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
    const el = this.el();

    const textEdge = getSelectedOptionValue(el.querySelector('.vjs-edge-style select'));
    const fontFamily = getSelectedOptionValue(el.querySelector('.vjs-font-family select'));
    const fgColor = getSelectedOptionValue(el.querySelector('.vjs-fg-color > select'));
    const textOpacity = getSelectedOptionValue(el.querySelector('.vjs-text-opacity > select'));
    const bgColor = getSelectedOptionValue(el.querySelector('.vjs-bg-color > select'));
    const bgOpacity = getSelectedOptionValue(el.querySelector('.vjs-bg-opacity > select'));
    const windowColor = getSelectedOptionValue(el.querySelector('.window-color > select'));
    const windowOpacity = getSelectedOptionValue(el.querySelector('.vjs-window-opacity > select'));
    const fontPercent = window['parseFloat'](getSelectedOptionValue(el.querySelector('.vjs-font-percent > select')));

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
    const el = this.el();

    setSelectedOption(el.querySelector('.vjs-edge-style select'), values.edgeStyle);
    setSelectedOption(el.querySelector('.vjs-font-family select'), values.fontFamily);
    setSelectedOption(el.querySelector('.vjs-fg-color > select'), values.color);
    setSelectedOption(el.querySelector('.vjs-text-opacity > select'), values.textOpacity);
    setSelectedOption(el.querySelector('.vjs-bg-color > select'), values.backgroundColor);
    setSelectedOption(el.querySelector('.vjs-bg-opacity > select'), values.backgroundOpacity);
    setSelectedOption(el.querySelector('.window-color > select'), values.windowColor);
    setSelectedOption(el.querySelector('.vjs-window-opacity > select'), values.windowOpacity);

    let fontPercent = values.fontPercent;

    if (fontPercent) {
      fontPercent = fontPercent.toFixed(2);
    }

    setSelectedOption(el.querySelector('.vjs-font-percent > select'), fontPercent);
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
