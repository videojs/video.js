
// Potential Future automation
// https://github.com/mcrmfc/qunit_sauce_runner
// http://saucelabs.com/blog/index.php/2011/06/javascript-unit-testing-with-jellyfish-and-ondemand/
// https://github.com/admc/jellyfish/blob/master/test/fun/jfqunit.js

function createVideoTag(id){
  var tagCode, tag, attrs;

  tagCode = '<video id="vid1" controls class="video-js vjs-default-skin" preload="none" width="640" height="264" data-setup=\'{}\' poster="http://video-js.zencoder.com/oceans-clip.png">';
  tagCode+= '<source src="http://video-js.zencoder.com/oceans-clip.mp4" type="video/mp4">';
  tagCode+= '<source src="http://video-js.zencoder.com/oceans-clip.webm" type="video/webm">';
  tagCode+= '<source src="http://video-js.zencoder.com/oceans-clip.ogv" type="video/ogg; codecs=\'theora, vorbis\'">';
  tagCode+= '</video>';

  tag = document.createElement("video");
  
  tag.id = "vid1";
  tag.controls = true;
  tag.className = "video-js vjs-default-skin";
  tag.preload = "auto";
  tag.width = "640";
  tag.height = "264";
  tag.poster = "http://video-js.zencoder.com/oceans-clip.png";

  source1 = document.createElement("source");
  source1.src = "http://video-js.zencoder.com/oceans-clip.mp4";
  source1.type = "video/mp4";
  tag.appendChild(source1);

  source2 = document.createElement("source");
  source2.src = "http://video-js.zencoder.com/oceans-clip.webm";
  source2.type = "video/webm";
  tag.appendChild(source2);

  source3 = document.createElement("source");
  source3.src = "http://video-js.zencoder.com/oceans-clip.ogv";
  source3.type = "video/ogg";
  tag.appendChild(source3);

  return tag;
}

function playerSetup(){

  _V_.el("player_box").appendChild(createVideoTag())

  var vid = document.getElementById("vid1");
  this.player = _V_(vid);

  stop();

  this.player.ready(_V_.proxy(this, function(){
    start();
  }));
}

function playerTeardown(){
  stop();
  _V_("vid1").destroy();
  // document.body.removeChild(document.getElementById("vid1"));
  delete this.player;
  setTimeout(function(){
    start();
  }, 500);
}

module("Video.js setup", {
  setup: playerSetup,
  teardown: playerTeardown
});

test("Player Set Up", function() {
  ok(this.player);
});

/* Methods
================================================================================ */
module("API Methods", {
  setup: playerSetup,
  teardown: playerTeardown
});

function failOnEnded() {
  this.player.one("ended", _V_.proxy(this, function(){
    start();
  }));
}

// Play Method
test("Play", 1, function() {
  stop();

  this.player.one("playing", _V_.proxy(this, function(){
    ok(true);
    start();
  }));

  this.player.play();

  failOnEnded.call(this);
});

// Pause Method
test("Pause", 1, function() {
  stop();

  // Flash doesn't currently like calling pause immediately after 'playing'.
  this.player.one("timeupdate", _V_.proxy(this, function(){

    this.player.pause();

  }));

  this.player.addEvent("pause", _V_.proxy(this, function(){
    ok(true);
    start();
  }));

  this.player.play();
});

// Paused Method
test("Paused", 2, function() {
  stop();

  this.player.one("timeupdate", _V_.proxy(this, function(){
    equal(this.player.paused(), false);
    this.player.pause();
  }));

  this.player.addEvent("pause", _V_.proxy(this, function(){
    equal(this.player.paused(), true);
    start();
  }));

  this.player.play();
});

test("currentTime()", 1, function() {
  stop();

  // Try for 3 time updates, sometimes it updates at 0 seconds.
  // var tries = 0;

  // Can't rely on just time update because it's faked for Flash.
  this.player.one("loadeddata", _V_.proxy(this, function(){

    this.player.addEvent("timeupdate", _V_.proxy(this, function(){

      if (this.player.currentTime() > 0) {
        ok(true, "Time is greater than 0.");
        start();
      } else {
        // tries++;
      }

      // if (tries >= 3) {
      //   start();
      // }
    }));

  }));
  
  this.player.play();
});


test("currentTime(seconds)", 2, function() {
  stop();

  // var afterPlayback = _V_.proxy(this, function(){
  //   this.player.currentTime(this.player.duration() / 2);
  // 
  //   this.player.addEvent("timeupdate", _V_.proxy(this, function(){
  //     ok(this.player.currentTime() > 0, "Time is greater than 0.");
  //     
  //     this.player.pause();
  //     
  //     this.player.addEvent("timeupdate", _V_.proxy(this, function(){
  //       ok(this.player.currentTime() == 0, "Time is 0.");
  //       start();
  //     }));
  // 
  //     this.player.currentTime(0);
  //   }));
  // });

  // Wait for Source to be ready.
  this.player.one("loadeddata", _V_.proxy(this, function(){

    _V_.log("loadeddata", this.player);
    this.player.currentTime(this.player.duration() - 1);

  }));
  
  this.player.one("seeked", _V_.proxy(this, function(){

    _V_.log("seeked", this.player.currentTime())
    ok(this.player.currentTime() > 1, "Time is greater than 1.");

    this.player.one("seeked", _V_.proxy(this, function(){
      
      _V_.log("seeked2", this.player.currentTime())

      ok(this.player.currentTime() <= 1, "Time is less than 1.");
      start();

    }));

    this.player.currentTime(0);

  }));


  this.player.play();

  // this.player.one("timeupdate", _V_.proxy(this, function(){
  // 
  //   this.player.currentTime(this.player.duration() / 2);
  // 
  //   this.player.one("timeupdate", _V_.proxy(this, function(){
  //     ok(this.player.currentTime() > 0, "Time is greater than 0.");
  // 
  //     this.player.pause();
  //     this.player.currentTime(0);
  // 
  //     this.player.one("timeupdate", _V_.proxy(this, function(){
  // 
  //       ok(this.player.currentTime() == 0, "Time is 0.");
  //       start();
  // 
  //     }));
  // 
  //   }));
  // 
  // 
  // }));

});

/* Events
================================================================================ */
module("API Events", {
  setup: playerSetup,
  teardown: playerTeardown
});

var playEventList = []

// Test all playback events
test("Initial Events", 12, function() {
  stop(); // Give 30 seconds to run then fail.

  var events = [
    // "loadstart" // Called during setup
    "play",
    "playing",

    "durationchange",
    "loadedmetadata",
    "loadeddata",
    "loadedalldata",

    "progress",
    "timeupdate",

    "canplay",
    "canplaythrough",

    "pause",
    "ended"
  ];

  // Add an event listener for each event type.
  for (var i=0, l=events.length; i<l; i++) {
    var evt = events[i];
    
    // Bind player and event name to function so event name value doesn't get overwritten.
    this.player.one(evt, _V_.proxy({ player: this.player, evt: evt }, function(){
      ok(true, this.evt);

      // Once we reach canplaythrough, pause the video and wait for 'paused'.
      if (this.evt == "loadedalldata") {
        this.player.pause();
      
      // After we've paused, go to the end of the video and wait for 'ended'.
      } else if (this.evt == "pause") {
        this.player.currentTime(this.player.duration() - 1);

        // Flash has an issue calling play too quickly after currentTime. Hopefully we'll fix this.
        setTimeout(this.player.proxy(function(){
          this.play();
        }), 250);

      // When we reach ended, we're done. Continue with the test suite.
      } else if (this.evt == "ended") {
        start();
      }
    }));
  }

  this.player.play();
});