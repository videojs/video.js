// Player Extenstions
_V_.merge(_V_.Player.prototype, {

  // Add an array of text tracks. captions, subtitles, chapters, descriptions
  addTextTracks: function(trackObjects){
    var tracks = this.textTracks = (this.textTracks) ? this.textTracks : [],
        i = 0, 
        j = trackObjects.length, 
        track, Kind;

    for (;i<j;i++) {
      // HTML5 Spec says default to subtitles.
      // Captitalize first letter to match class names
      Kind = _V_.capitalize(trackObjects[i].kind || "subtitles");

      // Create correct texttrack class. CaptionsTrack, etc.
      track = new _V_[Kind + "Track"](this, trackObjects[i]);

      tracks.push(track);

      if (track.default) {
        this.ready(_V_.proxy(track, track.show));
      }
    }
  },

  getTextTrackByKind: function(kind, srclang, label){
    var tracks = this.textTracks,
        i = 0,
        j = tracks.length,
        track;

    for (;i<j;i++) {
      track = tracks[i];
      if (track.kind == kind && (!srclang || track.language == srclang) && (!label || label == track.label)) {
        break;
      }
    }

    return track;
  }

});

_V_.Track = _V_.Component.extend({

  init: function(player, options){
    this._super(player, options);

    _V_.merge(this, {
      // Build ID if one doesn't exist
      id: options.id || ("vjs_" + options.kind + "_" + options.language + "_" + _V_.guid++),

      src: options.src,

      // If default is used, subtitles/captions to start showing
      "default": options["default"], // 'default' is reserved-ish
      title: options.title,

      // readonly attribute DOMString language;
      language: options.srclang,

      // readonly attribute DOMString label;
      label: options.label,

      // readonly attribute TextTrackCueList cues;
      cues: [],

      // readonly attribute TextTrackCueList activeCues;
      activeCues: [],

      // const unsigned short NONE = 0;
      // const unsigned short LOADING = 1;
      // const unsigned short LOADED = 2;
      // const unsigned short ERROR = 3;
      // readonly attribute unsigned short readyState;
      readyState: 0,

      // const unsigned short OFF = 0;
      // const unsigned short HIDDEN = 1;
      // const unsigned short SHOWING = 2;
      // attribute unsigned short mode;
      mode: 0,

      currentCue: false,
      lastCueIndex: 0
    });

    // this.update = this.proxy(this.update);
    // this.update.guid = this.kind + this.update.guid;

  },

  createElement: function(){
    return this._super("div", {
      className: "vjs-" + this.kind + " vjs-text-track"
    });
  },

  // Show: Mode Showing (2)
  // Indicates that the text track is active. If no attempt has yet been made to obtain the track's cues, the user agent will perform such an attempt momentarily.
  // The user agent is maintaining a list of which cues are active, and events are being fired accordingly. 
  // In addition, for text tracks whose kind is subtitles or captions, the cues are being displayed over the video as appropriate; 
  // for text tracks whose kind is descriptions, the user agent is making the cues available to the user in a non-visual fashion; 
  // and for text tracks whose kind is chapters, the user agent is making available to the user a mechanism by which the user can navigate to any point in the media resource by selecting a cue.
  // The showing by default state is used in conjunction with the default attribute on track elements to indicate that the text track was enabled due to that attribute. 
  // This allows the user agent to override the state if a later track is discovered that is more appropriate per the user's preferences.
  show: function(){
    this.activate();

    this.mode = 2;

    // Show element.
    this._super();
  },
  
  // Hide: Mode Hidden (1)
  // Indicates that the text track is active, but that the user agent is not actively displaying the cues. 
  // If no attempt has yet been made to obtain the track's cues, the user agent will perform such an attempt momentarily. 
  // The user agent is maintaining a list of which cues are active, and events are being fired accordingly.
  hide: function(){
    // When hidden, cues are still triggered. Disable to stop triggering.
    this.activate();

    this.mode = 1;

    // Hide element.
    this._super();
  },

  // Disable: Mode Off/Disable (0)
  // Indicates that the text track is not active. Other than for the purposes of exposing the track in the DOM, the user agent is ignoring the text track.
  // No cues are active, no events are fired, and the user agent will not attempt to obtain the track's cues.
  disable: function(){
    // If showing, hide.
    if (this.mode == 2) { this.hide(); }

    // Stop triggering cues
    this.deactivate();

    // Switch Mode to Off
    this.mode = 0;
  },

  activate: function(){
    if (this.readyState == 0) {
      this.load();
    }

    // Only activate if not already active.
    if (this.mode == 0) {
      // Update current cue on timeupdate
      // Using unique ID for proxy function so other tracks don't remove listener
      this.player.addEvent("timeupdate", this.proxy(this.update, this.id));

      // Reset cue time on media end
      this.player.addEvent("ended", this.proxy(this.reset, this.id));

      // Add to display
      this.player.textTrackDisplay.addComponent(this);
    }
  },

  deactivate: function(){
    // Using unique ID for proxy function so other tracks don't remove listener
    this.player.removeEvent("timeupdate", this.proxy(this.update, this.id));
    this.player.removeEvent("ended", this.proxy(this.reset, this.id));
    this.reset(); // Reset

    // Remove from display
    this.player.textTrackDisplay.removeComponent(this);
  },

  // A readiness state
  // One of the following:
  // 
  // Not loaded
  // Indicates that the text track is known to exist (e.g. it has been declared with a track element), but its cues have not been obtained.
  // 
  // Loading
  // Indicates that the text track is loading and there have been no fatal errors encountered so far. Further cues might still be added to the track.
  // 
  // Loaded
  // Indicates that the text track has been loaded with no fatal errors. No new cues will be added to the track except if the text track corresponds to a MutableTextTrack object.
  // 
  // Failed to load
  // Indicates that the text track was enabled, but when the user agent attempted to obtain it, this failed in some way (e.g. URL could not be resolved, network error, unknown text track format). Some or all of the cues are likely missing and will not be obtained.
  load: function(){

    // Only load if not loaded yet.
    if (this.readyState == 0) {
      _V_.get(this.src, this.proxy(this.parseCues), this.proxy(this.onError));
    }

  },

  onError: function(err){
    this.error = err;
    this.triggerEvent("error");
  },

  parseCues: function(srcContent) {
    var cue, time, text,
        lines = srcContent.split("\n"),
        line = "";

    for (var i=1, j=lines.length; i<j; i++) {
      // Line 0 should be 'WEBVTT', so skipping i=0

      line = _V_.trim(lines[i]); // Trim whitespace and linebreaks

      if (line) { // Loop until a line with content

        // First line - Number
        cue = {
          id: line, // Cue Number
          index: this.cues.length // Position in Array
        };

        // Second line - Time
        line = _V_.trim(lines[++i]);
        time = line.split(" --> ");
        cue.startTime = this.parseCueTime(time[0]);
        cue.endTime = this.parseCueTime(time[1]);

        // Additional lines - Cue Text
        text = [];

        // Loop until a blank line or end of lines
        // Assumeing trim("") returns false for blank lines
        while (lines[++i] && (line = _V_.trim(lines[i]))) {
          text.push(line);
        }

        cue.text = text.join('<br/>');

        // Add this cue
        this.cues.push(cue);
      }
    }

    this.triggerEvent("loaded");
  },

  parseCueTime: function(timeText) {
    var parts = timeText.split(':'),
        time = 0,
        flags, seconds;
    // hours => seconds
    time += parseFloat(parts[0])*60*60;
    // minutes => seconds
    time += parseFloat(parts[1])*60;
    // get seconds and flags
    // TODO: Make additional cue layout settings work
    flags = parts[2].split(/\s+/)
    // Seconds is the first part before any spaces.
    // Could use either . or , for decimal
    seconds = flags.splice(0,1)[0].split(/\.|,/);
    time += parseFloat(seconds);
    // add miliseconds
    ms = parseFloat(seconds[1]);
    if (ms) { time += ms/1000; }
    return time;
  },

  update: function(){
    if (this.cues.length > 0) {

      // Get curent player time
      var time = this.player.currentTime();

      // Check if the new time is outside the time box created by the the last update.
      if (this.prevChange === undefined || time < this.prevChange || this.nextChange <= time) {
        var cues = this.cues,

            // Create a new time box for this state.
            nextChange = 0,
            prevChange = this.player.duration(),
            reverse = false,
            newCues = [],
            firstActiveIndex,
            lastActiveIndex,
            html = "",
            cue, i, j;

        // Check if time is going forwards or backwards (scrubbing/rewinding)
        // If we know the direction we can optimize the starting position and direction of the loop through the cues array.
        if (nextChange <= time) {
          // Forwards, so start at the index of the first active cue and loop forward
          i = (this.firstActiveIndex !== undefined) ? this.firstActiveIndex : 0;
        } else {
          // Backwards, so start at the index of the last active cue and loop backward
          reverse = true;
          i = (this.lastActiveIndex !== undefined) ? this.lastActiveIndex : cues.length;
        }

        while (true) { // Loop until broken
          cue = cues[i];

          // Cue ended at this point
          if (cue.endTime <= time) {
            prevChange = Math.max(prevChange, cue.endTime);

            if (cue.active) {
              cue.active = false;
            }

          // Cue hasn't started
          } else if (time < cue.startTime) {
            nextChange = Math.min(nextChange, cue.startTime);

            if (cue.active) {
              cue.active = false;
            }

            // No later cues should have an active start time.
            break;

          // Cue is current
          } else if (time < cue.endTime) {

            if (reverse) {
              // Add cue to front of array to keep in time order
              newCues.splice(0,0,cue);

              // If in reverse, the first current cue is our lastActiveCue
              if (lastActiveIndex === undefined) { lastActiveIndex = i; }
              firstActiveIndex = i;
            } else {
              // Add cue to end of array
              newCues.push(cue);

              // If forward, the first current cue is our firstActiveIndex
              if (firstActiveIndex === undefined) { firstActiveIndex = i; }
              lastActiveIndex = i;
            }

            nextChange = Math.min(nextChange, cue.endTime);
            prevChange = Math.max(prevChange, cue.startTime);

            cue.active = true;
          }

          if (reverse) {
            if (i === 0) { break; } else { i--; }
          } else {
            if (i === cues.length - 1) { break; } else { i++; }
          }

        }

        this.nextChange = nextChange;
        this.prevChange = prevChange;
        this.firstActiveIndex = firstActiveIndex;
        this.lastActiveIndex = lastActiveIndex;

        for (i=0,j=newCues.length;i<j;i++) {
          html += "<span class='vjs-tt-cue'>"+cue.text+"</span>";
        }

        this.el.innerHTML = html;

      }
    }


    // // Assuming all cues are in order by time, and do not overlap
    // if (this.cues && this.cues.length > 0) {
    //   var time = this.player.currentTime();
    //   // If current cue should stay showing, don't do anything. Otherwise, find new cue.
    //   if (!this.currentCue || this.currentCue.startTime >= time || this.currentCue.endTime < time) {
    //     var newSubIndex = false,
    //       // // Loop in reverse if lastCue is after current time (optimization)
    //       // // Meaning the user is scrubbing in reverse or rewinding
    //       // reverse = (this.cues[this.lastCueIndex].startTime > time),
    //       // // If reverse, step back 1 becase we know it's not the lastCue
    //       // i = this.lastCueIndex - (reverse ? 1 : 0);
    //     // while (true) { // Loop until broken
    //     //   if (reverse) { // Looping in reverse
    //     //     // Stop if no more, or this cue ends before the current time (no earlier cues should apply)
    //     //     if (i < 0 || this.cues[i].endTime < time) { break; }
    //     //     // End is greater than time, so if start is less, show this cue
    //     //     if (this.cues[i].startTime < time) {
    //     //       newSubIndex = i;
    //     //       break;
    //     //     }
    //     //     i--;
    //     //   } else { // Looping forward
    //     //     // Stop if no more, or this cue starts after time (no later cues should apply)
    //     //     if (i >= this.cues.length || this.cues[i].startTime > time) { break; }
    //     //     // Start is less than time, so if end is later, show this cue
    //     //     if (this.cues[i].endTime > time) {
    //     //       newSubIndex = i;
    //     //       break;
    //     //     }
    //     //     i++;
    //     //   }
    //     // }
    // 
    //     // // Set or clear current cue
    //     // if (newSubIndex !== false) {
    //     //   this.currentCue = this.cues[newSubIndex];
    //     //   this.lastCueIndex = newSubIndex;
    //     //   this.updatePlayer(this.currentCue.text);
    //     // } else if (this.currentCue) {
    //     //   this.currentCue = false;
    //     //   this.updatePlayer("");
    //     // }
    //   }
    // }
  },

  reset: function(){
    this.nextChange = 0;
    this.prevChange = this.player.duration();
    this.firstActiveIndex = 0;
    this.lastActiveIndex = 0;
  }

});

_V_.CaptionsTrack = _V_.Track.extend({
  kind: "captions"
});

_V_.SubtitlesTrack = _V_.Track.extend({
  kind: "subtitles"
});


/* Text Track Displays
================================================================================ */
// Create a behavior type for each text track type (subtitlesDisplay, captionsDisplay, etc.).
// Then you can easily do something like.
//    player.addBehavior(myDiv, "subtitlesDisplay");
// And the myDiv's content will be updated with the text change.

// Base class for all track displays. Should not be instantiated on its own.
_V_.TextTrackDisplay = _V_.Component.extend({

  // init: function(player, options){
  //   this._super(player, options);
  // 
  //   player.addEvent(this.trackType + "update", _V_.proxy(this, this.update));
  // },

  createElement: function(){
    return this._super("div", {
      className: "vjs-" + this.trackType + " vjs-text-track-display"
    });
  },

  update: function(){
    this.el.innerHTML = this.player.textTrackValue(this.trackType);
  }

});

// _V_.SubtitlesDisplay = _V_.TextTrackDisplay.extend({ trackType: "subtitles" });
// _V_.CaptionsDisplay = _V_.TextTrackDisplay.extend({ trackType: "captions" });
// _V_.ChaptersDisplay = _V_.TextTrackDisplay.extend({ trackType: "chapters" });
// _V_.DescriptionsDisplay = _V_.TextTrackDisplay.extend({ trackType: "descriptions" });

/* Captions Button
================================================================================ */
_V_.TextTrackButton = _V_.Button.extend({

  init: function(player, options){
    this._super(player, options);

    this.list = _V_.createElement("ul");

    var count = 0,
        lis = [],
        li,
        off = _V_.createElement("li", { innerHTML: "OFF" });

    _V_.addEvent(off, "click", this.proxy(this.turnOff));

    this.each(this.player.textTracks, function(track){
      if (track.kind === this.kind) {
        count++;

        li = _V_.createElement("li", { innerHTML: track.label });

        var tempLang = track.language,
            tempLabel = track.label;
        _V_.addEvent(li, "click", this.proxy(function(){
          this.turnOn(tempLang, tempLabel);
        }));

        lis.push(li);
      }
    });

    if (count > 0) {
      // Only one lang
      if (count == 1) {
        lis[0].innerHTML = "ON";
        lis.push(off);
      } else {
        // Add Off to the top of the list
        lis.splice(0,0,off);
      }
      
      for (var i=0;i<lis.length;i++) {
        this.list.appendChild(lis[i]);
      }
      
      this.el.appendChild(this.list);
      
    } else {
      this.hide();
    }

  },

  turnOn: function(lang, label){
    var tracks = this.player.textTracks,
        i=0, j=tracks.length,
        track;

    for (;i<j;i++) {
      track = tracks[i];
      if (track.kind == this.kind) {
        if (track.language == lang && track.label == label) {
          track.show();
        } else if (track.mode > 0) {
          track.disable();
        }
      }
    }
  },
  
  turnOff: function(){
    var tracks = this.player.textTracks,
        i=0, j=tracks.length,
        track;

    for (;i<j;i++) {
      track = tracks[i];
      if (track.kind == this.kind && track.mode > 0) {
        track.disable();
      }
    }
  },

  buildCSSClass: function(){
    return this.className + " vjs-feature-button " + this._super();
  }

});

_V_.CaptionsButton = _V_.TextTrackButton.extend({
  kind: "captions",
  buttonText: "Captions",
  className: "vjs-captions-button"
});

_V_.SubtitlesButton = _V_.TextTrackButton.extend({
  kind: "subtitles",
  buttonText: "Subtitles",
  className: "vjs-subtitles-button"
});

// Add Buttons to controlBar
_V_.merge(_V_.ControlBar.prototype.options.components, {
  "subtitlesButton": {},
  "captionsButton": {}
});

// _V_.Cue = _V_.Component.extend({
//   init: function(player, options){
//     this._super(player, options);
//   }
// });