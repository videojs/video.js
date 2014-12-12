(function() {
/*
 * https://html.spec.whatwg.org/multipage/embedded-content.html#texttrack
 *
 * interface TextTrack : EventTarget {
 *   readonly attribute TextTrackKind kind;
 *   readonly attribute DOMString label;
 *   readonly attribute DOMString language;
 *
 *   readonly attribute DOMString id;
 *   readonly attribute DOMString inBandMetadataTrackDispatchType;
 *
 *   attribute TextTrackMode mode;
 *
 *   readonly attribute TextTrackCueList? cues;
 *   readonly attribute TextTrackCueList? activeCues;
 *
 *   void addCue(TextTrackCue cue);
 *   void removeCue(TextTrackCue cue);
 *
 *   attribute EventHandler oncuechange;
 * };
 */

vjs.TextTrack = function(options) {
  var tt, id, mode, kind, label, language, cues, activeCues, player, timeupdateHandler, changed, prop;

  tt = this;
  if (vjs.IS_IE8) {
    tt = document.createElement('custom');

    for (prop in vjs.TextTrack.prototype) {
      tt[prop] = vjs.TextTrack.prototype[prop];
    }
  }

  options = options || {};

  player = options.player || {
    on: Function.prototype
  };
  mode = vjs.TextTrackMode[options.mode] || 'disabled';
  kind = vjs.TextTrackKind[options.kind] || 'subtitles';
  label = options.label || '';
  language = options.language || '';
  id = options.id || '';

  tt.cues_ = [];
  tt.activeCues_ = [];

  cues = new vjs.TextTrackCueList(tt.cues_);
  activeCues = new vjs.TextTrackCueList(tt.activeCues_);

  changed = false;
  timeupdateHandler = vjs.bind(tt, function() {
    this.activeCues;
    if (changed) {
      this.trigger('cuechange');
      changed = false;
    }
  });

  Object.defineProperty(tt, 'kind', {
    get: function() {
      return kind;
    },
    set: Function.prototype
  });

  Object.defineProperty(tt, 'label', {
    get: function() {
      return label;
    },
    set: Function.prototype
  });

  Object.defineProperty(tt, 'language', {
    get: function() {
      return language;
    },
    set: Function.prototype
  });

  Object.defineProperty(tt, 'id', {
    get: function() {
      return id;
    },
    set: Function.prototype
  });

  Object.defineProperty(tt, 'mode', {
    get: function() {
      return mode;
    },
    set: function(newMode) {
      if (!vjs.TextTrackMode[newMode]) {
        return;
      }
      mode = newMode;
      if (mode === 'showing') {
        player.on('timeupdate', timeupdateHandler);
      }
      this.trigger('modechange');
    }
  });

  Object.defineProperty(tt, 'cues', {
    get: function() {
      return cues;
    },
    set: Function.prototype
  });

  Object.defineProperty(tt, 'activeCues', {
    get: function() {
      var i, l, active, ct, cue;

      if (this.cues.length === 0) {
        return activeCues; // nothing to do
      }

      ct = player.currentTime();
      i = 0;
      l = this.cues.length;
      active = [];

      for (; i < l; i++) {
        cue = this.cues[i];
        if (cue.startTime <= ct && cue.endTime >= ct) {
          active.push(cue);
        }
        if (active[i] !== this.activeCues_[i]) {
          changed = true;
        }
      }

      this.activeCues_ = active;
      activeCues.setCues_(this.activeCues_);

      return activeCues;
    },
    set: Function.prototype
  });

  player.on('dispose', function() {
    player.off('timeupdate', timeupdateHandler);
  });

  if (options.src) {
    loadTrack(options.src, tt);
  }

  if (vjs.IS_IE8) {
    return tt;
  }
};

vjs.TextTrack.prototype = vjs.obj.create(vjs.EventEmitter.prototype);
vjs.TextTrack.prototype.constructor = vjs.TextTrack;

/*
 * cuechange - One or more cues in the track have become active or stopped being active.
 */
vjs.TextTrack.prototype.allowedEvents_ = {
  'cuechange': 'cuechange'
};

vjs.TextTrack.prototype.addCue = function(cue) {
  this.cues_.push(cue);
  this.cues.setCues_(this.cues_);
};

vjs.TextTrack.prototype.removeCue = function(removeCue) {
  var i = 0,
      l = this.cues_.length,
      cue,
      removed = false;

  for (; i < l; i++) {
    cue = this.cues_[i];
    if (cue === removeCue) {
      this.cues_.splice(i, 1);
      removed = true;
    }
  }

  if (!removed) {
    throw new Error('Cue Not Found');
  }

  this.cues.setCues_(this.cues_);
};

/*
 * Downloading stuff happens below this point
 */
var loadTrack, parseCues;

loadTrack = function(src, track) {
  vjs.xhr(src, vjs.bind(this, function(err, response, responseBody){
    if (err) {
      return vjs.log.error(err);
    }

    parseCues(responseBody, track);
  }));
};

parseCues = function(srcContent, track) {
  if (typeof window.WebVTT !== 'function') {
    //try again a bit later
    return window.setTimeout(function() {
      parseCues(srcContent, track);
    }, 25);
  }

  var parser = new window.WebVTT.Parser(window, window.WebVTT.StringDecoder());

  parser.oncue = function(cue) {
    track.addCue(cue);
  };
  parser.onparsingerror = function(error) {
    vjs.log.error(error);
  };

  parser.parse(srcContent);
  parser.flush();
};

})();
