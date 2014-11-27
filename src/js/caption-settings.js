(function() {
  'use strict';

  vjs.TextTrackSettings = vjs.Component.extend({
    init: function(player, options) {
      vjs.Component.call(this, player, options);
      this.hide();

      this.fontSize = 12;

      vjs.on(this.el().querySelector('.vjs-done-button'), 'click', vjs.bind(this, function() {
        this.hide();
      }));

      vjs.on(this.el().querySelector('.vjs-default-button'), 'click', vjs.bind(this, function() {
        this.el().querySelector('.vjs-fg-color > select').selectedIndex = 0;
        this.el().querySelector('.vjs-bg-color > select').selectedIndex = 0;
        this.el().querySelector('.window-color > select').selectedIndex = 0;
        this.el().querySelector('.vjs-text-opacity > select').selectedIndex = 0;
        this.el().querySelector('.vjs-bg-opacity > select').selectedIndex = 0;
        this.el().querySelector('.vjs-window-opacity > select').selectedIndex = 0;
        this.el().querySelector('.vjs-edge-style select').selectedIndex = 0;
        this.el().querySelector('.vjs-font-family select').selectedIndex = 0;
        this.fontSize = 12;
        this.updateDisplay();
      }));

      vjs.on(this.el().querySelector('.font-plus'), 'click', vjs.bind(this, function() {
        this.fontSize++;
        this.updateDisplay();
      }));
      vjs.on(this.el().querySelector('.font-minus'), 'click', vjs.bind(this, function() {
        this.fontSize--;
        this.updateDisplay();
      }));

      vjs.on(this.el().querySelector('.vjs-fg-color > select'), 'change', vjs.bind(this, this.updateDisplay));
      vjs.on(this.el().querySelector('.vjs-bg-color > select'), 'change', vjs.bind(this, this.updateDisplay));
      vjs.on(this.el().querySelector('.window-color > select'), 'change', vjs.bind(this, this.updateDisplay));
      vjs.on(this.el().querySelector('.vjs-text-opacity > select'), 'change', vjs.bind(this, this.updateDisplay));
      vjs.on(this.el().querySelector('.vjs-bg-opacity > select'), 'change', vjs.bind(this, this.updateDisplay));
      vjs.on(this.el().querySelector('.vjs-window-opacity > select'), 'change', vjs.bind(this, this.updateDisplay));
      vjs.on(this.el().querySelector('.vjs-edge-style select'), 'change', vjs.bind(this, this.updateDisplay));
      vjs.on(this.el().querySelector('.vjs-font-family select'), 'change', vjs.bind(this, this.updateDisplay));
    }
  });

  vjs.TextTrackSettings.prototype.createEl = function() {
    return vjs.Component.prototype.createEl.call(this, 'div', {
      className: 'vjs-caption-settings vjs-modal-overlay',
      innerHTML: captionOptionsMenuTemplate()
    });
  };

  vjs.TextTrackSettings.prototype.getValues = function() {
    var el, bgOpacity, textOpacity, windowOpacity, textEdge, fontFamily, fgColor, bgColor, windowColor, result, name;

    el = this.el();

    textEdge = getSelectedOptionValue(el.querySelector('.vjs-edge-style select'));
    fontFamily = getSelectedOptionValue(el.querySelector('.vjs-font-family select'));
    fgColor = getSelectedOptionValue(el.querySelector('.vjs-fg-color > select'));
    textOpacity = getSelectedOptionValue(el.querySelector('.vjs-text-opacity > select'));
    bgColor = getSelectedOptionValue(el.querySelector('.vjs-bg-color > select'));
    bgOpacity = getSelectedOptionValue(el.querySelector('.vjs-bg-opacity > select'));
    windowColor = getSelectedOptionValue(el.querySelector('.window-color > select'));
    windowOpacity = getSelectedOptionValue(el.querySelector('.vjs-window-opacity > select'));

    result = {
      'backgroundOpacity': bgOpacity,
      'textOpacity': textOpacity,
      'windowOpacity': windowOpacity,
      'edgeStyle': textEdge,
      'fontFamily': fontFamily,
      'color': fgColor,
      'backgroundColor': bgColor,
      'windowColor': windowColor
    };
    for (name in result) {
      if (result[name] === '' || result[name] === 'none') {
        delete result[name];
      }
    }
    if (this.fontSize !== 12) {
      result.fontSize = this.fontSize + 'px';
    }
    return result;
  };

  vjs.TextTrackSettings.prototype.updateDisplay = function() {
    vjs.obj.each(this.player().textTracks(), function(i, el) {
      el.updateDisplay();
    });
  };

  function getSelectedOptionValue(target) {
    var selectedOption;
    // not all browsers support selectedOptions, so, fallback to options
    if (target.selectedOptions) {
      selectedOption = target.selectedOptions[0];
    } else if (target.options) {
      selectedOption = target.options[target.options.selectedIndex];
    }

    return selectedOption.value;
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
              '<span class="vjs-bg-opacity vjs-opacity vjs-tracksetting">' +
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
          '<div class="font-size vjs-tracksetting">' +
            '<label class="vjs-label">Font Size</label>' +
            '<button name="font-size" class="font-minus">-</button>' +
            '<button name="font-size" class="font-plus">+</button>' +
          '</div>' + // vjs-font-size
          '<div class="vjs-edge-style vjs-tracksetting">' +
            '<label class="vjs-label">Text Edge Style' +
              '<select>' +
                '<option value="none">None</option>' +
                '<option value="raised">Raised</option>' +
                '<option value="depressed">Depressed</option>' +
                '<option value="uniform">Uniform</option>' +
                '<option value="dropshadow">Dropshadow</option>' +
              '</select>' +
            '</label>' +
          '</div>' + // vjs-edge-style
          '<div class="vjs-font-family vjs-tracksetting">' +
            '<label class="vjs-label">Font Family' +
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
            '</label>' +
          '</div>' + // vjs-font-family
        '</div>' +
      '</div>' +
      '<div class="vjs-tracksettings-controls">' +
        '<button class="vjs-default-button">Defaults</button>' +
        '<button class="vjs-done-button">Close</button>' +
      '</div>';
  }

})();
