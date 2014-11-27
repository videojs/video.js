(function() {
  'use strict';

  vjs.TextTrackSettings = vjs.Component.extend({
    init: function(player, options) {
      vjs.Component.call(this, player, options);
      this.hide();

      this.fontSize = 12;

      vjs.on(this.el().querySelector('.done-button'), 'click', vjs.bind(this, function() {
        this.hide();
      }));

      vjs.on(this.el().querySelector('.default-button'), 'click', vjs.bind(this, function() {
        this.el().querySelector('.fg-color > select').selectedIndex = 0;
        this.el().querySelector('.bg-color > select').selectedIndex = 0;
        this.el().querySelector('.window-color > select').selectedIndex = 0;
        this.el().querySelector('.text-opacity > select').selectedIndex = 0;
        this.el().querySelector('.bg-opacity > select').selectedIndex = 0;
        this.el().querySelector('.window-opacity > select').selectedIndex = 0;
        this.el().querySelector('.edge-style > select').selectedIndex = 0;
        this.el().querySelector('.font-family > select').selectedIndex = 0;
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

      vjs.on(this.el().querySelector('.fg-color > select'), 'change', vjs.bind(this, this.updateDisplay));
      vjs.on(this.el().querySelector('.bg-color > select'), 'change', vjs.bind(this, this.updateDisplay));
      vjs.on(this.el().querySelector('.window-color > select'), 'change', vjs.bind(this, this.updateDisplay));
      vjs.on(this.el().querySelector('.text-opacity > select'), 'change', vjs.bind(this, this.updateDisplay));
      vjs.on(this.el().querySelector('.bg-opacity > select'), 'change', vjs.bind(this, this.updateDisplay));
      vjs.on(this.el().querySelector('.window-opacity > select'), 'change', vjs.bind(this, this.updateDisplay));
      vjs.on(this.el().querySelector('.edge-style > select'), 'change', vjs.bind(this, this.updateDisplay));
      vjs.on(this.el().querySelector('.font-family > select'), 'change', vjs.bind(this, this.updateDisplay));
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

    textEdge = getSelectedOptionValue(el.querySelector('.edge-style > select'));
    fontFamily = getSelectedOptionValue(el.querySelector('.font-family > select'));
    fgColor = getSelectedOptionValue(el.querySelector('.vjs-fg-color > select'));
    textOpacity = getSelectedOptionValue(el.querySelector('.text-opacity > select'));
    bgColor = getSelectedOptionValue(el.querySelector('.vjs-bg-color > select'));
    bgOpacity = getSelectedOptionValue(el.querySelector('.bg-opacity > select'));
    windowColor = getSelectedOptionValue(el.querySelector('.window-color > select'));
    windowOpacity = getSelectedOptionValue(el.querySelector('.window-opacity > select'));

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
    return '<div>' +
        '<div class="vjs-tracksettings-colors">' +
          '<div class="vjs-fg-color vjs-tracksetting">' +
              '<span style="width:65px;display:block">Foreground</span>' +
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
              '<div class="text-opacity" style="display:inline">' +
                '<select class="center">' +
                  '<option value="">---</option>' +
                  '<option value="1">Opaque</option>' +
                  '<option value="0.5">Semi-Opaque</option>' +
                '</select>' +
              '</div>' +
          '</div>' +
          '<div class="vjs-bg-color vjs-tracksetting">' +
              '<span style="width:65px;display:block">Background</span>' +
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
              '<div class="bg-opacity vjs-tracksetting" style="display:inline">' +
                  '<select class="center">' +
                    '<option value="">---</option>' +
                    '<option value="1">Opaque</option>' +
                    '<option value="0.5">Semi-Transparent</option>' +
                    '<option value="0">Transparent</option>' +
                  '</select>' +
              '</div>' +
          '</div>' +
          '<div class="window-color vjs-tracksetting">' +
              '<span style="width:65px;display:block">Window</span>' +
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
              '<div class="window-opacity" style="display:inline">' +
                  '<select class="center">' +
                    '<option value="">---</option>' +
                    '<option value="1">Opaque</option>' +
                    '<option value="0.5">Semi-Transparent</option>' +
                    '<option value="0">Transparent</option>' +
                  '</select>' +
              '</div>' +
          '</div>' +
        '</div>' +
        '<div class="vjs-tracksettings-font">' +
          '<div class="font-size vjs-tracksetting">' +
            '<label>Font Size</label>' +
            '<input type="button" name="font-size" class="font-minus" value="-"/>' +
            '<input type="button" name="font-size" class="font-plus" value="+"/>' +
          '</div>' +
          '<div class="edge-style vjs-tracksetting">' +
            '<label>Text Edge Style</label>' +
            '<select>' +
              '<option value="none">None</option>' +
              '<option value="raised">Raised</option>' +
              '<option value="depressed">Depressed</option>' +
              '<option value="uniform">Uniform</option>' +
              '<option value="dropshadow">Dropshadow</option>' +
            '</select>' +
          '</div>' +
          '<div class="font-family vjs-tracksetting">' +
            '<label>Font Family</label>' +
            '<select>' +
              '<option value="">---</option>' +
              '<option value="monospaceSerif">Monospace Serif</option>' +
              '<option value="proportionalSerif">Proportional Serif</option>' +
              '<option value="monospaceSansSerif">Monospace Sans-Serif</option>' +
              '<option value="proportionalSansSerif">Proportional Sans-Serif</option>' +
              '<option value="casual">Casual</option>' +
              '<option value="script">Script</option>' +
              '<option value="small-caps">Small Caps</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="vjs-tracksettings-controls">' +
        '<button class="default-button">Defaults</button>' +
        '<button class="done-button">Close</button>' +
      '</div>';
  }

})();
