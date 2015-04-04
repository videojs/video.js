// Fake a media playback tech controller so that player tests
// can run without HTML5 or Flash, of which PhantomJS supports neither.

import MediaTechController from '../../src/js/media/media.js';
import * as Lib from '../../src/js/lib.js';
import Component from '../../src/js/component.js';

/**
 * @constructor
 */
var MediaFaker = MediaTechController.extend({
  init: function(player, options, onReady){
    MediaTechController.call(this, player, options, onReady);

    this.triggerReady();
  }
});

// Support everything except for "video/unsupported-format"
MediaFaker.isSupported = function(){ return true; };
MediaFaker.canPlaySource = function(srcObj){ return srcObj.type !== 'video/unsupported-format'; };

MediaFaker.prototype.createEl = function(){
  var el = MediaTechController.prototype.createEl.call(this, 'div', {
    className: 'vjs-tech'
  });
  if (this.player().poster()) {
    // transfer the poster image to mimic HTML
    el.poster = this.player().poster();
  }

  Lib.insertFirst(el, this.player_.el());

  return el;
};

// fake a poster attribute to mimic the video element
MediaFaker.prototype.poster = function(){ return this.el().poster; };
MediaFaker.prototype['setPoster'] = function(val){ this.el().poster = val; };

MediaFaker.prototype.currentTime = function(){ return 0; };
MediaFaker.prototype.seeking = function(){ return false; };
MediaFaker.prototype.src = function(){ return 'movie.mp4'; };
MediaFaker.prototype.volume = function(){ return 0; };
MediaFaker.prototype.muted = function(){ return false; };
MediaFaker.prototype.pause = function(){ return false; };
MediaFaker.prototype.paused = function(){ return true; };
MediaFaker.prototype.play = function() {
  this.player().trigger('play');
};
MediaFaker.prototype.supportsFullScreen = function(){ return false; };
MediaFaker.prototype.buffered = function(){ return {}; };
MediaFaker.prototype.duration = function(){ return {}; };
MediaFaker.prototype.networkState = function(){ return 0; };
MediaFaker.prototype.readyState = function(){ return 0; };

Component.registerComponent('MediaFaker', MediaFaker);
module.exports = MediaFaker;