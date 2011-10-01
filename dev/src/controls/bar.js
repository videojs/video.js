_V_.controlSets.bar = {
  options: {},
  add: function(){
    /* See controls/controls.html to see the HTML this creates. */

    // Create a reference to the controls elements
    var bar = this.cels.bar = {};

    // Control Bar Main Div ("main")
    bar.main = _V_.createElement("div", { className: "vjs-controls" });
    // Add the controls to the video's container
    this.box.appendChild(bar.main);
    this.addBehavior(bar.main, "controlBar");

    // Play Control
    bar.playControl = _V_.createElement("div", {
      className: "vjs-play-control vjs-control",
      innerHTML: '<div><span class="vjs-control-text">Play</span></div>',
      role: "button", tabIndex: 0
    });
    bar.main.appendChild(bar.playControl);
    this.addBehavior(bar.playControl, "playToggle");

    /* Time -------------------------------------------------------------- */
    // Time Display
    bar.currentTime = _V_.createElement("div", { 
      className: "vjs-current-time vjs-time-controls vjs-control"
    });
    bar.currentTimeDisplay = _V_.createElement("span", { 
      className: "vjs-current-time-display",
      innerHTML: '0:00'
    });
    // Put display inside div, inside control div, to follow control scheme.
    bar.currentTime.appendChild(_V_.createElement("div").appendChild(bar.currentTimeDisplay));
    bar.main.appendChild(bar.currentTime);
    this.addBehavior(bar.currentTimeDisplay, "currentTimeDisplay");

    // Time Separator (Not used in main skin, but still available, and could be used as a 'spare element')
    bar.timeDivider = _V_.createElement("div", {
      className: "vjs-time-divider",
      innerHTML: '<div><span>/</span></div>'
    });
    bar.main.appendChild(bar.timeDivider);

    // Duration Display
    bar.duration = _V_.createElement("div", { 
      className: "vjs-duration vjs-time-controls vjs-control"
    });
    bar.durationDisplay = _V_.createElement("span", { 
      className: "vjs-duration-display",
      innerHTML: '0:00'
    });
    // Put display inside div, inside control div, to follow control scheme.
    bar.duration.appendChild(_V_.createElement("div").appendChild(bar.durationDisplay));
    bar.main.appendChild(bar.duration);
    this.addBehavior(bar.durationDisplay, "durationDisplay");
    
    // Duration Display
    bar.remainingTime = _V_.createElement("div", { 
      className: "vjs-remaining-time vjs-time-controls vjs-control"
    });
    bar.remainingTimeDisplay = _V_.createElement("span", { 
      className: "vjs-remaining-time-display",
      innerHTML: '-0:00'
    });
    // Put display inside div, inside control div, to follow control scheme.
    bar.remainingTime.appendChild(_V_.createElement("div").appendChild(bar.remainingTimeDisplay));
    bar.main.appendChild(bar.remainingTime);
    this.addBehavior(bar.remainingTime, "remainingTimeDisplay");

    /* Progress -------------------------------------------------------------- */
    // Progress Control: Seek, Load Progress, and Play Progress
    bar.progressControl = _V_.createElement("div", { className: "vjs-progress-control vjs-control" });
    bar.main.appendChild(bar.progressControl);

    // Seek Bar and holder for the progress bars
    bar.seekBar = _V_.createElement("div", { className: "vjs-progress-holder" });
    bar.progressControl.appendChild(bar.seekBar);

    // Load Progress Bar
    bar.loadProgressBar = _V_.createElement("div", {
      className: "vjs-load-progress",
      innerHTML: '<span class="vjs-control-text">Loaded: 0%</span>'
    });
    bar.seekBar.appendChild(bar.loadProgressBar);
    this.addBehavior(bar.loadProgressBar, "loadProgressBar");

    // Play Progress Bar
    bar.playProgressBar = _V_.createElement("div", { 
      className: "vjs-play-progress",
      innerHTML: '<span class="vjs-control-text">Progress: 0%</span>'
    });
    bar.seekBar.appendChild(bar.playProgressBar);

    // Seek Handle
    bar.seekHandle = _V_.createElement("div", {
      className: "vjs-seek-handle",
      innerHTML: '<span class="vjs-control-text">00:00</span>',
      tabIndex: 0,
      role: "slider", "aria-valuenow": 0, "aria-valuemin": 0, "aria-valuemax": 100
    });
    bar.seekBar.appendChild(bar.seekHandle);

    // SeekBar Behavior includes play progress bar, and seek handle
    // Needed so it can determine seek position based on handle position/size
    this.addBehavior(bar.seekBar, "seekBar");

    /* Fullscreen -------------------------------------------------------------- */
    // Fullscreen Button
    bar.fullscreenControl = _V_.createElement("div", {
      className: "vjs-fullscreen-control vjs-control",
      innerHTML: '<div><span class="vjs-control-text">Fullscreen</span></div>',
      role: "button", tabIndex: 0
    });
    bar.main.appendChild(bar.fullscreenControl);
    this.addBehavior(bar.fullscreenControl, "fullscreenToggle");

    /* Volume -------------------------------------------------------------- */
    // Fullscreen Button
    bar.volumeControl = _V_.createElement("div", { className: "vjs-volume-control vjs-control" });
    bar.volumeBar = _V_.createElement("div", { className: "vjs-volume-bar" });
    bar.volumeLevel = _V_.createElement("div", {
      className: "vjs-volume-level",
      innerHTML: '<span class="vjs-control-text"></span>'
    });
    bar.volumeHandle = _V_.createElement("div", {
      className: "vjs-volume-handle",
      innerHTML: '<span class="vjs-control-text"></span>',
      tabindex: 0,
      role: "slider", "aria-valuenow": 0, "aria-valuemin": 0, "aria-valuemax": 100
    });
    
    bar.volumeBar.appendChild(bar.volumeLevel);
    bar.volumeBar.appendChild(bar.volumeHandle);
    bar.volumeControl.appendChild(bar.volumeBar);
    bar.main.appendChild(bar.volumeControl);
    this.addBehavior(bar.volumeBar, "volumeBar");

    // Mute Button
    bar.muteControl = _V_.createElement("div", {
      className: "vjs-mute-control vjs-control",
      innerHTML: '<div><span class="vjs-control-text">Mute</span></div>',
      role: "button", tabIndex: 0
    });
    bar.main.appendChild(bar.muteControl);
    this.addBehavior(bar.muteControl, "muteToggle");
  },
  remove: function(){
    this.box.removeChild(this.cels.bigPlayButton);
    delete this.cels.bigPlayButton;
    this.removeBehavior(this.cels.bigPlayButton, "bigPlayButton");
  }
};
