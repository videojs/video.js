_V_.Track = function(attributes, player){
  // Store reference to the parent player
  this.player = player;

  this.src = attributes.src;
  this.kind = attributes.kind;
  this.srclang = attributes.srclang;
  this.label = attributes.label;
  this["default"] = attributes["default"]; // 'default' is reserved-ish
  this.title = attributes.title;

  this.cues = [];
  this.currentCue = false;
  this.lastCueIndex = 0;

  // Update current cue on timeupdate
  player.addEvent("timeupdate", _V_.proxy(this, this.update));

  // Reset cue time on media end
  player.addEvent("ended", _V_.proxy(this, function() { this.lastCueIndex = 0; }));

  // Load Track File
  _V_.get(attributes.src, _V_.proxy(this, this.parseCues));
};

_V_.Track.prototype = {

  parseCues: function(srcContent) {
    var cue, time, text,
        lines = srcContent.split("\n"),
        line = "";

    for (var i=1, j=lines.length; i<j; i++) {
      // Line 0 should be 'WEBVTT', so skipping i=0

      _V_.log("line", lines[i])

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
        for (var m=i,n=lines.length; m<n; m++) { // Loop until a blank line or end of lines

          _V_.log(lines[i+1])

          line = _V_.trim(lines[++i]);
          if (!line) { break; } // Text is done
          text.push(line);
        }
        cue.text = text.join('<br/>');

        // Add this cue
        this.cues.push(cue);
      }
    }
  },

  parseCueTime: function(timeText) {
    var parts = timeText.split(':'),
        time = 0;
    // hours => seconds
    time += parseFloat(parts[0])*60*60;
    // minutes => seconds
    time += parseFloat(parts[1])*60;
    // get seconds
    var seconds = parts[2].split(/\.|,/); // Either . or ,
    time += parseFloat(seconds[0]);
    // add miliseconds
    ms = parseFloat(seconds[1]);
    if (ms) { time += ms/1000; }
    return time;
  },

  update: function(){
    // Assuming all cues are in order by time, and do not overlap
    if (this.cues && this.cues.length > 0) {
      var time = this.player.currentTime();
      // If current cue should stay showing, don't do anything. Otherwise, find new cue.
      if (!this.currentCue || this.currentCue.startTime >= time || this.currentCue.endTime < time) {
        var newSubIndex = false,
          // Loop in reverse if lastCue is after current time (optimization)
          // Meaning the user is scrubbing in reverse or rewinding
          reverse = (this.cues[this.lastCueIndex].startTime > time),
          // If reverse, step back 1 becase we know it's not the lastCue
          i = this.lastCueIndex - (reverse ? 1 : 0);
        while (true) { // Loop until broken
          if (reverse) { // Looping in reverse
            // Stop if no more, or this cue ends before the current time (no earlier cues should apply)
            if (i < 0 || this.cues[i].endTime < time) { break; }
            // End is greater than time, so if start is less, show this cue
            if (this.cues[i].startTime < time) {
              newSubIndex = i;
              break;
            }
            i--;
          } else { // Looping forward
            // Stop if no more, or this cue starts after time (no later cues should apply)
            if (i >= this.cues.length || this.cues[i].startTime > time) { break; }
            // Start is less than time, so if end is later, show this cue
            if (this.cues[i].endTime > time) {
              newSubIndex = i;
              break;
            }
            i++;
          }
        }

        // Set or clear current cue
        if (newSubIndex !== false) {
          this.currentCue = this.cues[newSubIndex];
          this.lastCueIndex = newSubIndex;
          this.updatePlayer(this.currentCue.text);
        } else if (this.currentCue) {
          this.currentCue = false;
          this.updatePlayer("");
        }
      }
    }
  },

  // Update the stored value for the current track kind
  // and trigger an event to update all text track displays.
  updatePlayer: function(text){
    this.player.textTrackValue(this.kind, text);
  }
};
