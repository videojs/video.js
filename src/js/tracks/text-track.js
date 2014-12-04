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
  var tt, id, mode, kind, label, language, cues, activeCues, player;

  tt = this;
  if (vjs.IS_IE8) {
    tt = document.createElement('custom');
  }

  player = options.player;
  mode = vjs.TextTrackMode[options.mode] || 'disabled';
  kind = vjs.TextTrackKind[options.kind] || 'subtitles';
  label = options.label || '';
  language = options.language || '';
  id = options.id || '';

  tt.cues_ = [];
  tt.activeCues_ = [];

  cues = new vjs.TextTrackCueList(this.cues_);
  activeCues = new vjs.TextTrackCueList(this.activeCues_);

  Object.defineProperty(tt, 'kind', {
    get: function() {
      return kind;
    }
  });

  Object.defineProperty(tt, 'label', {
    get: function() {
      return label;
    }
  });

  Object.defineProperty(tt, 'langauge', {
    get: function() {
      return language;
    }
  });

  Object.defineProperty(tt, 'id', {
    get: function() {
      return id;
    }
  });

  Object.defineProperty(tt, 'mode', {
    get: function() {
      return mode;
    },
    set: function(newMode) {
      if (vjs.TextTrackMode[newMode]) {
        return;
      }
      mode = newMode;
      this.trigger('modechange');
    }
  });

  Object.defineProperty(tt, 'cues', {
    get: function() {
      return cues;
    }
  });

  var changed = false;
  Object.defineProperty(tt, 'activeCues', {
    get: function() {
      var i, l, active, ct, cue;

      if (this.cues.length === 0) {
        return; // nothing to do
      }

      ct = player.currentTime();
      i = 0;
      l = this.cues.length;
      active = [];
      this.activeCues_ = [];

      for (; i < l; i++) {
        cue = this.cues[i];
        if (cue.startTime <= ct && cue.endTime >= ct) {
          active.push(cue);
        }
      }

      this.activeCues_ = active;
      activeCues.setCues_(this.activeCues_);

      setTimeout(vjs.bind(this, function() {
        this.trigger('cuechange');
      }), 0);

      return activeCues;
    }
  });

  var timeupdateHandler = vjs.bind(this, function() {
    this.activeCues;
  });
  player.on('timeupdate', timeupdateHandler);
  player.on('dispose', function() {
    player.off('timeupdate', timeupdateHandler);
  });
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
