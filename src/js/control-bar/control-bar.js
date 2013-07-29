/**
 * Container of main controls
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.ControlBar = vjs.Component.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Component.call(this, player, options);

    // // Controls are always off
    // if (player.controls() === false) {
    //   this.disable();
    // // Controls are always on
    // } else if (player.controls() === true) {
    //   this.setup();
    // // Controls fade when not in use
    // } else {
    //   this.disable();
    //   this.setup();
    // }
  }
});

vjs.ControlBar.prototype.options_ = {
  loadEvent: 'play',
  children: {
    'playToggle': {},
    'currentTimeDisplay': {},
    'timeDivider': {},
    'durationDisplay': {},
    'remainingTimeDisplay': {},
    'progressControl': {},
    'fullscreenToggle': {},
    'volumeControl': {},
    'muteToggle': {}
    // 'volumeMenuButton': {}
  }
};

vjs.ControlBar.prototype.createEl = function(){
  return vjs.createEl('div', {
    className: 'vjs-control-bar'
  });
};

vjs.ControlBar.prototype.fadeIn = function(){
  vjs.Component.prototype.fadeIn.call(this);
  this.player_.trigger('controlsvisible');
};

vjs.ControlBar.prototype.fadeOut = function(){
  vjs.Component.prototype.fadeOut.call(this);
  this.player_.trigger('controlshidden');
};
