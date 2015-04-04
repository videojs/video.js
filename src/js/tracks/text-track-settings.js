import Component from '../component';
import * as Lib from '../lib';
import * as Events from '../events';
import window from 'global/window';

let TextTrackSettings = Component.extend({
  init: function(player, options) {
    Component.call(this, player, options);
    this.hide();

    Events.on(this.el().querySelector('.vjs-done-button'), 'click', Lib.bind(this, function() {
      this.saveSettings();
      this.hide();
    }));

    Events.on(this.el().querySelector('.vjs-default-button'), 'click', Lib.bind(this, function() {
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

    Events.on(this.el().querySelector('.vjs-fg-color > select'), 'change', Lib.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-bg-color > select'), 'change', Lib.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.window-color > select'), 'change', Lib.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-text-opacity > select'), 'change', Lib.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-bg-opacity > select'), 'change', Lib.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-window-opacity > select'), 'change', Lib.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-font-percent select'), 'change', Lib.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-edge-style select'), 'change', Lib.bind(this, this.updateDisplay));
    Events.on(this.el().querySelector('.vjs-font-family select'), 'change', Lib.bind(this, this.updateDisplay));

    if (player.options()['persistTextTrackSettings']) {
      this.restoreSettings();
    }
  }
});

Component.registerComponent('TextTrackSettings', TextTrackSettings);

TextTrackSettings.prototype.createEl = function() {
  return Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-caption-settings vjs-modal-overlay',
    innerHTML: captionOptionsMenuTemplate()
  });
};

TextTrackSettings.prototype.getValues = function() {
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
};

TextTrackSettings.prototype.setValues = function(values) {
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
};

TextTrackSettings.prototype.restoreSettings = function() {
  let values;
  try {
    values = JSON.parse(window.localStorage.getItem('vjs-text-track-settings'));
  } catch (e) {}

  if (values) {
    this.setValues(values);
  }
};

TextTrackSettings.prototype.saveSettings = function() {
  if (!this.player_.options()['persistTextTrackSettings']) {
    return;
  }

  let values = this.getValues();
  try {
    if (!Lib.isEmpty(values)) {
      window.localStorage.setItem('vjs-text-track-settings', JSON.stringify(values));
    } else {
      window.localStorage.removeItem('vjs-text-track-settings');
    }
  } catch (e) {}
};

TextTrackSettings.prototype.updateDisplay = function() {
  let ttDisplay = this.player_.getChild('textTrackDisplay');
  if (ttDisplay) {
    ttDisplay.updateDisplay();
  }
};

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
  return '<div class="vjs-tracksettings">' +
      '<div class="vjs-tracksettings-colors">' +
        '<div class="vjs-fg-color vjs-tracksetting">' +
            '<label class="vjs-label">Foreground</label>' +
            '<select>' +
              '<option value="">---</option>' +
              '<option value="#FFF">White</option>' +
              '<option value="#000">Black</option>' +
              '<option value="#F00">Red</option>' +
              '<option value="#0F0">Green</option>' +
              '<option value="#00F">Blue</option>' +
              '<option value="#FF0">Yellow</option>' +
              '<option value="#F0F">Magenta</option>' +
              '<option value="#0FF">Cyan</option>' +
            '</select>' +
            '<span class="vjs-text-opacity vjs-opacity">' +
              '<select>' +
                '<option value="">---</option>' +
                '<option value="1">Opaque</option>' +
                '<option value="0.5">Semi-Opaque</option>' +
              '</select>' +
            '</span>' +
        '</div>' + // vjs-fg-color
        '<div class="vjs-bg-color vjs-tracksetting">' +
            '<label class="vjs-label">Background</label>' +
            '<select>' +
              '<option value="">---</option>' +
              '<option value="#FFF">White</option>' +
              '<option value="#000">Black</option>' +
              '<option value="#F00">Red</option>' +
              '<option value="#0F0">Green</option>' +
              '<option value="#00F">Blue</option>' +
              '<option value="#FF0">Yellow</option>' +
              '<option value="#F0F">Magenta</option>' +
              '<option value="#0FF">Cyan</option>' +
            '</select>' +
            '<span class="vjs-bg-opacity vjs-opacity">' +
                '<select>' +
                  '<option value="">---</option>' +
                  '<option value="1">Opaque</option>' +
                  '<option value="0.5">Semi-Transparent</option>' +
                  '<option value="0">Transparent</option>' +
                '</select>' +
            '</span>' +
        '</div>' + // vjs-bg-color
        '<div class="window-color vjs-tracksetting">' +
            '<label class="vjs-label">Window</label>' +
            '<select>' +
              '<option value="">---</option>' +
              '<option value="#FFF">White</option>' +
              '<option value="#000">Black</option>' +
              '<option value="#F00">Red</option>' +
              '<option value="#0F0">Green</option>' +
              '<option value="#00F">Blue</option>' +
              '<option value="#FF0">Yellow</option>' +
              '<option value="#F0F">Magenta</option>' +
              '<option value="#0FF">Cyan</option>' +
            '</select>' +
            '<span class="vjs-window-opacity vjs-opacity">' +
                '<select>' +
                  '<option value="">---</option>' +
                  '<option value="1">Opaque</option>' +
                  '<option value="0.5">Semi-Transparent</option>' +
                  '<option value="0">Transparent</option>' +
                '</select>' +
            '</span>' +
        '</div>' + // vjs-window-color
      '</div>' + // vjs-tracksettings
      '<div class="vjs-tracksettings-font">' +
        '<div class="vjs-font-percent vjs-tracksetting">' +
          '<label class="vjs-label">Font Size</label>' +
          '<select>' +
            '<option value="0.50">50%</option>' +
            '<option value="0.75">75%</option>' +
            '<option value="1.00" selected>100%</option>' +
            '<option value="1.25">125%</option>' +
            '<option value="1.50">150%</option>' +
            '<option value="1.75">175%</option>' +
            '<option value="2.00">200%</option>' +
            '<option value="3.00">300%</option>' +
            '<option value="4.00">400%</option>' +
          '</select>' +
        '</div>' + // vjs-font-percent
        '<div class="vjs-edge-style vjs-tracksetting">' +
          '<label class="vjs-label">Text Edge Style</label>' +
          '<select>' +
            '<option value="none">None</option>' +
            '<option value="raised">Raised</option>' +
            '<option value="depressed">Depressed</option>' +
            '<option value="uniform">Uniform</option>' +
            '<option value="dropshadow">Dropshadow</option>' +
          '</select>' +
        '</div>' + // vjs-edge-style
        '<div class="vjs-font-family vjs-tracksetting">' +
          '<label class="vjs-label">Font Family</label>' +
          '<select>' +
            '<option value="">Default</option>' +
            '<option value="monospaceSerif">Monospace Serif</option>' +
            '<option value="proportionalSerif">Proportional Serif</option>' +
            '<option value="monospaceSansSerif">Monospace Sans-Serif</option>' +
            '<option value="proportionalSansSerif">Proportional Sans-Serif</option>' +
            '<option value="casual">Casual</option>' +
            '<option value="script">Script</option>' +
            '<option value="small-caps">Small Caps</option>' +
          '</select>' +
        '</div>' + // vjs-font-family
      '</div>' +
    '</div>' +
    '<div class="vjs-tracksettings-controls">' +
      '<button class="vjs-default-button">Defaults</button>' +
      '<button class="vjs-done-button">Done</button>' +
    '</div>';
}

export default TextTrackSettings;
