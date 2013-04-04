// Fake a media playback tech controller so that player tests
// can run without HTML5 or Flash, of which PhantomJS supports neither.

/**
 * @constructor
 */
vjs.MediaFaker = function(player, options, onReady){
  goog.base(this, player, options, onReady);

  this.triggerReady();
};
goog.inherits(vjs.MediaFaker, vjs.MediaTechController);

// Support everything
vjs.MediaFaker.isSupported = function(){ return true; };
vjs.MediaFaker.canPlaySource = function(srcObj){ return true; };
vjs.MediaFaker.prototype.features = {
  progressEvents: true,
  timeupdateEvents: true
};
vjs.MediaFaker.prototype.createEl = function(){
  var el = goog.base(this, 'createEl', 'div', {
    className: 'vjs-tech'
  });
  if (this.player().poster()) {
    // transfer the poster image to mimic HTML
    el.poster = this.player().poster();
  }

  vjs.insertFirst(el, this.player_.el());

  return el;
};

vjs.MediaFaker.prototype.currentTime = function(){ return 0; };
vjs.MediaFaker.prototype.volume = function(){ return 0; };

goog.exportSymbol('videojs.MediaFaker', vjs.MediaFaker);
goog.exportProperty(vjs.MediaFaker, 'isSupported', vjs.MediaFaker.isSupported);
goog.exportProperty(vjs.MediaFaker, 'canPlaySource', vjs.MediaFaker.canPlaySource);
