_V_.controlSets.subtitlesBox = {
  options: {},
  add: function(){
    /* Creating this HTML

      <div class="vjs-subtitles"></div>

    */

    // Create a reference to the element
    var subs = this.cels.subtitlesBox = _V_.createElement("div", { className: "vjs-subtitles" });

    // Add the controls to the video's container
    this.box.appendChild(subs);
    this.addBehavior(subs, "subtitlesDisplay");
  },
  remove: function(){
    this.removeBehavior(this.cels.subtitlesBox, "subtitlesDisplay");
    this.box.removeChild(this.cels.subtitlesBox);
    delete this.cels.subtitlesBox;
  }
};
