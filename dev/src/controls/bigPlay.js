_V_.controlSets.bigPlayButton = {
  options: {},
  add: function(){
    /* Creating this HTML
      <div class="vjs-big-play-button"><span></span></div>
    */
    this.cels.bigPlayButton = _V_.createElement("div", {
      className: "vjs-big-play-button",
      innerHTML: "<span></span>"
    });
    this.box.appendChild(this.cels.bigPlayButton);
    this.addBehavior(this.cels.bigPlayButton, "bigPlayButton");
  },
  remove: function(){
    this.removeBehavior(this.cels.bigPlayButton, "bigPlayButton");
    this.box.removeChild(this.cels.bigPlayButton);
    delete this.cels.bigPlayButton;
  }
};

/* Big Play Button Behaviors
================================================================================ */
VideoJS.fn.newBehavior("bigPlayButton",
  // Add Big Play Button Behavior
  function(element){
    if (!this.bels.bigPlayButtons) {
      this.bels.bigPlayButtons = [];
      this.addEvent("play", this.hideBigPlayButtons);
      this.addEvent("ended", this.showBigPlayButtons);
    }
    this.bels.bigPlayButtons.push(element);
    this.addBehavior(element, "playButton");
  },
  // Remove Big Play Button Behavior
  function(element){
    
  },
  // Needed functions (added directly to player (this))
  {
    showBigPlayButtons: function(){
      if (!this.options.controlsEnabled) { return; }
      this.each(this.bels.bigPlayButtons, function(element){
        element.style.display = "block";
      });
    },
    hideBigPlayButtons: function(){
      this.each(this.bels.bigPlayButtons, function(element){
        element.style.display = "none";
      });
    }
  }
);
