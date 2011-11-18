/* OLD VERSION OF CONTROL BAR */
_V_.controlSets.main = {
  options: {},
  add: function(){
    /* Creating this HTML
      <div class="vjs-controls">
        <div class="vjs-play-control">
          <span></span>
        </div>
        <div class="vjs-progress-control">
          <div class="vjs-progress-holder">
            <div class="vjs-load-progress"></div>
            <div class="vjs-play-progress"></div>
          </div>
        </div>
        <div class="vjs-time-control">
          <span class="vjs-current-time-display">00:00</span><span> / </span><span class="vjs-duration-display">00:00</span>
        </div>
        <div class="vjs-volume-control">
          <div>
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
        <div class="vjs-fullscreen-control">
          <div>
            <span></span><span></span><span></span><span></span>
          </div>
        </div>
      </div>
    */

    this.cels.main = {};

    // Create a div to hold the different controls
    this.cels.main.bar = _V_.createElement("div", { className: "vjs-controls" });
    // Add the controls to the video's container
    this.box.appendChild(this.cels.main.bar);
    this.addBehavior(this.cels.main.bar, "controlBar");

    // Build the play control
    this.cels.main.playControl = _V_.createElement("div", { className: "vjs-play-control vjs-control", innerHTML: "<span></span>" });
    this.cels.main.bar.appendChild(this.cels.main.playControl);
    this.addBehavior(this.cels.main.playControl, "playToggle");
     
    // Build the progress control
    this.cels.main.progressControl = _V_.createElement("div", { className: "vjs-progress-control vjs-control" });
    this.cels.main.bar.appendChild(this.cels.main.progressControl);

    // Create a holder for the progress bars
    this.cels.main.progressHolder = _V_.createElement("div", { className: "vjs-progress-holder" });
    this.cels.main.progressControl.appendChild(this.cels.main.progressHolder);
    this.addBehavior(this.cels.main.progressHolder, "seekBar");

    // Create the loading progress display
    this.cels.main.loadProgressBar = _V_.createElement("div", { className: "vjs-load-progress" });
    this.cels.main.progressHolder.appendChild(this.cels.main.loadProgressBar);
    this.addBehavior(this.cels.main.loadProgressBar, "loadProgressBar");

    // Create the playing progress display
    this.cels.main.playProgressBar = _V_.createElement("div", { className: "vjs-play-progress" });
    this.cels.main.progressHolder.appendChild(this.cels.main.playProgressBar);
    this.addBehavior(this.cels.main.playProgressBar, "playProgressBar");

    // Create the progress time display (00:00 / 00:00)
    this.cels.main.timeControl = _V_.createElement("div", { className: "vjs-time-control vjs-control" });
    this.cels.main.bar.appendChild(this.cels.main.timeControl);

    // // Create the current play time display
    this.cels.main.currentTimeDisplay = _V_.createElement("span", { className: "vjs-current-time-display", innerHTML: "00:00" });
    this.cels.main.timeControl.appendChild(this.cels.main.currentTimeDisplay);
    this.addBehavior(this.cels.main.currentTimeDisplay, "currentTimeDisplay");

    // Add time separator
    this.cels.main.timeSeparator = _V_.createElement("span", { innerHTML: " / " });
    this.cels.main.timeControl.appendChild(this.cels.main.timeSeparator);

    // Create the total duration display
    this.cels.main.durationDisplay = _V_.createElement("span", { className: "vjs-duration-display", innerHTML: "00:00" });
    this.cels.main.timeControl.appendChild(this.cels.main.durationDisplay);
    this.addBehavior(this.cels.main.durationDisplay, "durationDisplay");

    // Create the volumne control
    this.cels.main.volumeControl = _V_.createElement("div", {
      className: "vjs-volume-control vjs-control",
      innerHTML: '<div><span class="vjs-vc-1"></span><span class="vjs-vc-2"></span><span class="vjs-vc-3"></span><span class="vjs-vc-4"></span><span class="vjs-vc-5"></span><span class="vjs-vc-6"></span></div>'
    });
    this.cels.main.bar.appendChild(this.cels.main.volumeControl);
    this.addBehavior(this.cels.main.volumeControl, "volumeScrubber");

    this.cels.main.volumeDisplay = this.cels.main.volumeControl.children[0];
    this.addBehavior(this.cels.main.volumeDisplay, "volumeDisplay");

    // Crete the fullscreen control
    this.cels.main.fullscreenControl = _V_.createElement("div", {
      className: "vjs-fullscreen-control vjs-control",
      innerHTML: '<div><span class="vjs-fc-1"></span><span class="vjs-fc-2"></span><span class="vjs-fc-3"></span><span class="vjs-fc-4"></span></div>'
    });
    this.cels.main.bar.appendChild(this.cels.main.fullscreenControl);
    this.addBehavior(this.cels.main.fullscreenControl, "fullscreenToggle");
  },
  remove: function(){
    this.box.removeChild(this.cels.bigPlayButton);
    delete this.cels.bigPlayButton;
    this.removeBehavior(this.cels.bigPlayButton, "bigPlayButton");
  }
}

/* Control Bar Behaviors
================================================================================ */
VideoJS.fn.newBehavior("controlBar", 
  function(element){
    if (!this.bels.controlBars) {
      this.bels.controlBars = [];
      // this.addEvent("mouseover", this.showControlBars);
      // this.addEvent("mouseout", this.hideControlBars);
    }
    this.bels.controlBars.push(element);
  },
  function(element){},
  {
    showControlBars: function(){
      this.each(this.bels.controlBars, function(bar){
        // bar.style.opacity = 1;
        bar.style.display = "block";
      });
    },
    hideControlBars: function(){
      this.each(this.bels.controlBars, function(bar){
        // bar.style.opacity = 0;
        bar.style.display = "none";
      });
    }
  }
);
