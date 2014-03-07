/**
 * The component for controlling the playback rate
 *
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.PlaybackRateMenuButton = vjs.MenuButton.extend({
  /** @constructor */
  init: function(player, options){
    vjs.MenuButton.call(this, player, options);

    player.on('loadstart', vjs.bind(this, function(){
      // hide playback rate controls when they're no playback rate options to select
      if (( player.tech.features && player.tech.features['playbackRate'] === false) ||
          this.player_.options_.playbackRates.length === 0) {
            this.addClass('vjs-hidden');
      } else {
        this.removeClass('vjs-hidden');
      }
    }));

    player.on('ratechange', vjs.bind(this, this.rateChange));
  }
});


vjs.PlaybackRateMenuButton.prototype.createEl = function(){
  var rate = this.player_.tech.playbackRate() + 'x';
  return vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-playback-rate vjs-menu-button vjs-control',
    innerHTML:'<div class="vjs-playaback-rate-value">' + rate + '</div>'
  });
};

// Menu creation
vjs.PlaybackRateMenuButton.prototype.createMenu = function(){
  var menu = new vjs.Menu(this.player_);
  var rates = this.player_.options_.playbackRates;
  for (var i = rates.length - 1; i >= 0; i--) {
    menu.addChild(
      new vjs.PlaybackRateMenuItem(this.player_, {rate: rates[i] + 'x'})
      );
  };

  return menu;
};

vjs.PlaybackRateMenuButton.prototype.updateARIAAttributes = function(){
  // Current playback rate
  this.el_.setAttribute('aria-valuenow',this.player_.playbackRate());
};

vjs.PlaybackRateMenuButton.prototype.onClick = function(){
  // select next rate option
  var current_rate = this.player_.playbackRate();
  var rates = this.player_.options_.playbackRates;
  // wthis will select first if last currently selected
  var new_rate = rates[0];
  for (var i = 0; i <rates.length ; i++) {
    if (rates[i] > current_rate) {
      new_rate = rates[i];
      break;
    }
  };
  this.player_.playbackRate( new_rate );
};

// Update button label when rate changed
vjs.PlaybackRateMenuButton.prototype.rateChange = function(){
  this.el_.children[0].innerHTML = this.player_.playbackRate() + 'x';
};

/**
 * The specific menu item type for selecting a playback rate
 *
 * @constructor
 */
vjs.PlaybackRateMenuItem = vjs.MenuItem.extend({
  contentElType: 'button',
  /** @constructor */
  init: function(player, options){
    var label = this.label = options['rate'];
    var rate = this.rate = parseFloat(label, 10);

    // Modify options for parent MenuItem class's init.
    options['label'] = label;
    options['selected'] = rate === 1;
    vjs.MenuItem.call(this, player, options);

    this.player_.on('ratechange', vjs.bind(this, this.update));
  }
});

vjs.PlaybackRateMenuItem.prototype.onClick = function(){
  vjs.MenuItem.prototype.onClick.call(this);
  this.player_.playbackRate(this.rate);
};

vjs.PlaybackRateMenuItem.prototype.update = function(){
  this.selected(this.player_.playbackRate() == this.rate);
};
