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

    if (!player.controls()) {
      this.disable();
    }

    player.one('play', vjs.bind(this, function(){
      var touchstart,
        fadeIn = vjs.bind(this, this.fadeIn),
        fadeOut = vjs.bind(this, this.fadeOut);

      this.fadeIn();

      if ( !('ontouchstart' in window) ) {
        this.player_.on('mouseover', fadeIn);
        this.player_.on('mouseout', fadeOut);
        this.player_.on('pause', vjs.bind(this, this.lockShowing));
        this.player_.on('play', vjs.bind(this, this.unlockShowing));
      }

      touchstart = false;
      this.player_.on('touchstart', function() {
        touchstart = true;
      });
      this.player_.on('touchmove', function() {
        touchstart = false;
      });
      this.player_.on('touchend', vjs.bind(this, function(event) {
        var idx;
        if (touchstart) {
          idx = this.el().className.search('fade-in');
          if (idx !== -1) {
            this.fadeOut();
          } else {
            this.fadeIn();
          }
        }
        touchstart = false;

        if (!this.player_.paused()) {
          event.preventDefault();
        }
      }));
    }));
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