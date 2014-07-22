/**
 * Display that an error has occurred making the video unplayable
 * @param {vjs.Player|Object} player
 * @param {Object=} options
 * @constructor
 */
vjs.ErrorDisplay = vjs.Component.extend({
  init: function(player, options){
    vjs.Component.call(this, player, options);

    this.update();
    player.on('error', vjs.bind(this, this.update));
  }
});

vjs.ErrorDisplay.prototype.createEl = function(){
  var el = vjs.Component.prototype.createEl.call(this, 'div', {
    className: 'vjs-error-display'
  });

  this.contentEl_ = vjs.createEl('div');
  el.appendChild(this.contentEl_);

  return el;
};

vjs.ErrorDisplay.prototype.update = function(){
  if (this.player().error()) {
    this.contentEl_.innerHTML = this.player().error().message;
    // Determine Localization
    // Rules:
    // 1. If locale NOT english
    // 2. If localization dictionary exists for locale reported
    if (this.player().options().locale !== 'en-US' &&
      this.player().options().locale !== 'en' &&
      this.player().options().l20n &&
      this.player().options().l20n[this.player().options().locale] !== undefined)
    {
      vjs.localizeNode(this.contentEl_, this.player().options().locale, this.player().options().l20n[this.player().options().locale]);
    }
  }
};
