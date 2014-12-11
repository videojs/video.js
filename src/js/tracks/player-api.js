/**
 * @fileoverview Text Tracks
 * Text tracks are tracks of timed text events.
 * Captions - text displayed over the video for the hearing impaired
 * Subtitles - text displayed over the video for those who don't understand language in the video
 * Chapters - text displayed in a menu allowing the user to jump to particular points (chapters) in the video
 * Descriptions (not supported yet) - audio descriptions that are read back to the user by a screen reading device
 */

var getProp = function(obj, prop) {
  return (typeof obj[prop] === 'function') ? obj[prop]() : obj[prop];
};


/**
 * Get an array of associated text tracks. captions, subtitles, chapters, descriptions
 * http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-texttracks
 * @return {Array}           Array of track objects
 */
vjs.Player.prototype.textTracks = function(){
  // cannot use techGet directly because it checks to see whether the tech is ready.
  // Flash is unlikely to be ready in time but textTracks should still work.
  return this.tech && this.tech['textTracks']();
};

vjs.Player.prototype.remoteTextTracks = function() {
  return this.tech && this.tech['remoteTextTracks']();
};

/**
 * Add a text track
 * In addition to the W3C settings we allow adding additional info through options.
 * http://www.w3.org/html/wg/drafts/html/master/embedded-content-0.html#dom-media-addtexttrack
 * @param {String}  kind        Captions, subtitles, chapters, descriptions, or metadata
 * @param {String=} label       Optional label
 * @param {String=} language    Optional language
 */
vjs.Player.prototype.addTextTrack = function(kind, label, language) {
  return this.tech && this.tech['addTextTrack'](kind, label, language);
};

vjs.Player.prototype.addRemoteTextTrack = function(options) {
  return this.tech && this.tech['addRemoteTextTrack'](options);
};

vjs.Player.prototype.removeRemoteTextTrack = function(track) {
  this.tech && this.tech['removeRemoteTextTrack'](track);
};

var processCues = function(trackDisplay) {
  var cues = [],
      i = 0;

  for (; i < this.activeCues.length; i++) {
    cues.push(this.activeCues[i]);
  }

  window.WebVTT.processCues(window, cues, trackDisplay);
};

// Show a text track
// disableSameKind: disable all other tracks of the same kind. Value should be a track kind (captions, etc.)
vjs.Player.prototype.showTextTrack = function(id, disableSameKind){
  var tracks = this.textTracks(),
      i = 0,
      j = tracks.length,
      track,
      showTrack,
      mode,
      kind;

  // Find Track with same ID
  for (;i<j;i++) {
    track = tracks[i];
    mode = getProp(track, 'mode');

    if (getProp(track, 'id') === id || track.language === id) {
      if (track.show) {
        track.show();
      } else {
        track.mode = 'showing';
      }
      showTrack = track;

      track.on('cuechange', processCues.bind(track, this.player_.getChild('textTrackDisplay').el()));

    // Disable tracks of the same kind
    } else if (disableSameKind && getProp(track, 'kind') === disableSameKind &&
          (mode > 0 || mode === 'showing')) {
      if (track.disable) {
        track.disable();
      } else {
        track.mode = 'disabled';
      }
      track.off('cuechange', processCues.bind(track, this.player_.getChild('textTrackDisplay').el()));
    }
  }

  // Get track kind from shown track or disableSameKind
  kind = (showTrack) ? getProp(showTrack, 'kind') : ((disableSameKind) ? disableSameKind : false);

  // Trigger trackchange event, captionstrackchange, subtitlestrackchange, etc.
  if (kind) {
    this.trigger(kind+'trackchange');
  }

  return this;
};
