/* Big Play Button
================================================================================ */
/**
 * Initial play button. Shows before the video has played.
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.BigPlayButton = vjs.Button.extend({
  /** @constructor */
  init: function(player, options){
    vjs.Button.call(this, player, options);

    player.on('play', vjs.bind(this, this.hide));
    // player.on('ended', vjs.bind(this, this.show));
  }
});

vjs.BigPlayButton.prototype.createEl = function(){
  return vjs.Button.prototype.createEl.call(this, 'div', {
    className: 'vjs-big-play-button',
    innerHTML: '<span></span>',
    'aria-label': 'play video'
  });
};

vjs.BigPlayButton.prototype.onClick = function(){
  // Go back to the beginning if big play button is showing at the end.
  // Have to check for current time otherwise it might throw a 'not ready' error.
  //if(this.player_.currentTime()) {
    //this.player_.currentTime(0);
  //}
  this.player_.play();
};