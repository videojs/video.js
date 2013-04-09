// Fake a media playback tech controller so that player tests
// can run without HTML5 or Flash, of which PhantomJS supports neither.

/**
 * @constructor
 */
vjs.MediaFaker = vjs.MediaTechController.extend({
  init: function(player, options, onReady){
    vjs.MediaTechController.call(this, player, options, onReady);

    this.triggerReady();
  }
});

// Support everything
vjs.MediaFaker.isSupported = function(){ return true; };
vjs.MediaFaker.canPlaySource = function(srcObj){ return true; };

vjs.MediaFaker.prototype.createEl = function(){
  var el = vjs.MediaTechController.prototype.createEl.call(this, 'div', {
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

// Export vars for Closure Compiler
vjs['MediaFaker'] = vjs.MediaFaker;
vjs['MediaFaker']['isSupported'] = vjs.MediaFaker.isSupported;
vjs['MediaFaker']['canPlaySource'] = vjs.MediaFaker.canPlaySource;
