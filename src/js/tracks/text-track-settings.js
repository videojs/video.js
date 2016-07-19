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
    let uniqueId = this.id_;
    let dialogLabelId = 'TTsettingsDialogLabel-' + uniqueId;
    let dialogDescriptionId = 'TTsettingsDialogDescription-' + uniqueId;

    return super.createEl('div', {
      className: 'vjs-caption-settings vjs-modal-overlay',
      innerHTML: captionOptionsMenuTemplate(uniqueId, dialogLabelId, dialogDescriptionId),
      tabIndex: -1
    }, {
      role: 'dialog',
      'aria-labelledby': dialogLabelId,
      'aria-describedby': dialogDescriptionId
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
    let err, values;

    try {
      [err, values] = safeParseTuple(window.localStorage.getItem('vjs-text-track-settings'));

      if (err) {
        log.error(err);
      }
    } catch (e) {
      log.warn(e);
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
    } catch (e) {
      log.warn(e);
    }
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

function captionOptionsMenuTemplate(uniqueId, dialogLabelId, dialogDescriptionId) {

  let template = `
    <div role="document">
      <div role="heading" aria-level="1" id="${dialogLabelId}" class="vjs-control-text">Captions Settings Dialog</div>
      <div id="${dialogDescriptionId}" class="vjs-control-text">Beginning of dialog window. Escape will cancel and close the window.</div>
      <div class="vjs-tracksettings">
        <div class="vjs-tracksettings-colors">
          <fieldset class="vjs-fg-color vjs-tracksetting">
            <legend>Text</legend>
            <label class="vjs-label" for="captions-foreground-color-${uniqueId}">Color</label>
            <select id="captions-foreground-color-${uniqueId}">
              <option value="#FFF" selected>White</option>
              <option value="#000">Black</option>
              <option value="#F00">Red</option>
              <option value="#0F0">Green</option>
              <option value="#00F">Blue</option>
              <option value="#FF0">Yellow</option>
              <option value="#F0F">Magenta</option>
              <option value="#0FF">Cyan</option>
            </select>
            <span class="vjs-text-opacity vjs-opacity">
              <label class="vjs-label" for="captions-foreground-opacity-${uniqueId}">Transparency</label>
              <select id="captions-foreground-opacity-${uniqueId}">
                <option value="1" selected>Opaque</option>
                <option value="0.5">Semi-Opaque</option>
              </select>
            </span>
          </fieldset>
          <fieldset class="vjs-bg-color vjs-tracksetting">
            <legend>Background</legend>
            <label class="vjs-label" for="captions-background-color-${uniqueId}">Color</label>
            <select id="captions-background-color-${uniqueId}">
              <option value="#000" selected>Black</option>
              <option value="#FFF">White</option>
              <option value="#F00">Red</option>
              <option value="#0F0">Green</option>
              <option value="#00F">Blue</option>
              <option value="#FF0">Yellow</option>
              <option value="#F0F">Magenta</option>
              <option value="#0FF">Cyan</option>
            </select>
            <span class="vjs-bg-opacity vjs-opacity">
              <label class="vjs-label" for="captions-background-opacity-${uniqueId}">Transparency</label>
              <select id="captions-background-opacity-${uniqueId}">
                <option value="1" selected>Opaque</option>
                <option value="0.5">Semi-Transparent</option>
                <option value="0">Transparent</option>
              </select>
            </span>
          </fieldset>
          <fieldset class="window-color vjs-tracksetting">
            <legend>Window</legend>
            <label class="vjs-label" for="captions-window-color-${uniqueId}">Color</label>
            <select id="captions-window-color-${uniqueId}">
              <option value="#000" selected>Black</option>
              <option value="#FFF">White</option>
              <option value="#F00">Red</option>
              <option value="#0F0">Green</option>
              <option value="#00F">Blue</option>
              <option value="#FF0">Yellow</option>
              <option value="#F0F">Magenta</option>
              <option value="#0FF">Cyan</option>
            </select>
            <span class="vjs-window-opacity vjs-opacity">
              <label class="vjs-label" for="captions-window-opacity-${uniqueId}">Transparency</label>
              <select id="captions-window-opacity-${uniqueId}">
                <option value="0" selected>Transparent</option>
                <option value="0.5">Semi-Transparent</option>
                <option value="1">Opaque</option>
              </select>
            </span>
          </fieldset>
        </div> <!-- vjs-tracksettings-colors -->
        <div class="vjs-tracksettings-font">
          <div class="vjs-font-percent vjs-tracksetting">
            <label class="vjs-label" for="captions-font-size-${uniqueId}">Font Size</label>
            <select id="captions-font-size-${uniqueId}">
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
          </div>
          <div class="vjs-edge-style vjs-tracksetting">
            <label class="vjs-label" for="captions-edge-style-${uniqueId}">Text Edge Style</label>
            <select id="captions-edge-style-${uniqueId}">
              <option value="none" selected>None</option>
              <option value="raised">Raised</option>
              <option value="depressed">Depressed</option>
              <option value="uniform">Uniform</option>
              <option value="dropshadow">Dropshadow</option>
            </select>
          </div>
          <div class="vjs-font-family vjs-tracksetting">
            <label class="vjs-label" for="captions-font-family-${uniqueId}">Font Family</label>
            <select id="captions-font-family-${uniqueId}">
              <option value="proportionalSansSerif" selected>Proportional Sans-Serif</option>
              <option value="monospaceSansSerif">Monospace Sans-Serif</option>
              <option value="proportionalSerif">Proportional Serif</option>
              <option value="monospaceSerif">Monospace Serif</option>
              <option value="casual">Casual</option>
              <option value="script">Script</option>
              <option value="small-caps">Small Caps</option>
            </select>
          </div>
        </div> <!-- vjs-tracksettings-font -->
        <div class="vjs-tracksettings-controls">
          <button class="vjs-default-button">Defaults</button>
          <button class="vjs-done-button">Done</button>
        </div>
      </div> <!-- vjs-tracksettings -->
    </div> <!--  role="document" -->`;

    return template;
}

export default TextTrackSettings;
