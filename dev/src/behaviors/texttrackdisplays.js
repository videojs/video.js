/* Text Track Displays
================================================================================ */
// Create a behavior type for each text track type (subtitlesDisplay, captionsDisplay, etc.).
// Then you can easily do something like.
//    player.addBehavior(myDiv, "subtitlesDisplay");
// And the myDiv's content will be updated with the text change.
_V_.each(["subtitles", "captions", "chapters", "descriptions"], function(type){
  var add, remove,
      name = type+"Display",
      plural = name+"s",
      updateFuncName = "update"+plural,
      funcs = {};

  // Add the behavior to an element
  add = function(element){
    if (!this.bels[plural]) {
      this.bels[plural] = [];
      this.addEvent(type+"update", this[updateFuncName]);
    }
    this.bels[plural].push(element);
  };

  // Remove the behavior from an element
  remove = function(element){
    if (this.bels[plural]) {
      _V_.remove(element, this.bels[plural]);
      if (this.bels[plural].length == 0) {
        this.removeEvent(type+"update", this[updateFuncName]);
        delete this.bels[plural];
      }
    }
  };

  // Addional needed funcitons (added directly to player)
  funcs[updateFuncName] = function(){
    var val = this.textTrackValue(type);
    this.each(this.bels[plural], function(display){
      display.innerHTML = val;
    });
  };

  VideoJS.fn.newBehavior(name, add, remove, funcs);
});
