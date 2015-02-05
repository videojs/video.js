/**
 * Button to toggle between play and pause
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @class
 * @constructor
 */
vjs.PlayToggle = vjs.Button.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Button.call(this, player, options);

    this.on(player, 'ready', function(){
      if (this.player_.paused()) {
        this.addClass('vjs-paused');
      } else {
        this.addClass('vjs-playing');
      }
    });

    this.on(player, 'play', this.onPlay);
    this.on(player, 'pause', this.onPause);
    this.on(player, 'loadstart', this.onLoadStart);
  }
});

vjs.PlayToggle.prototype.buttonText = 'Play';

vjs.PlayToggle.prototype.buildCSSClass = function(){
  return 'vjs-play-control ' + vjs.Button.prototype.buildCSSClass.call(this);
};

// OnClick - Toggle between play and pause
vjs.PlayToggle.prototype.onClick = function(){
  if (this.player_.paused()) {
    this.player_.play();
  } else {
    this.player_.pause();
  }
};

// OnLoadStart - determine whether the playback state has changed and
// update the element if it has
vjs.PlayToggle.prototype.onLoadStart = function(){
  // invoke the approprate event handlers if the player's paused
  // attribute has changed
  if (!this.player_.paused() && !this.hasClass('vjs-playing')) {
    this.onPlay();
  } else if (!this.hasClass('vjs-paused')) {
    this.onPause();
  }
};

// OnPlay - Add the vjs-playing class to the element so it can change appearance
vjs.PlayToggle.prototype.onPlay = function(){
  this.removeClass('vjs-paused');
  this.addClass('vjs-playing');
  this.el_.children[0].children[0].innerHTML = this.localize('Pause'); // change the button text to "Pause"
};

  // OnPause - Add the vjs-paused class to the element so it can change appearance
vjs.PlayToggle.prototype.onPause = function(){
  this.removeClass('vjs-playing');
  this.addClass('vjs-paused');
  this.el_.children[0].children[0].innerHTML = this.localize('Play'); // change the button text to "Play"
};
