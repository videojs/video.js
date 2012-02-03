
// Potential Future automation
// https://github.com/mcrmfc/qunit_sauce_runner
// http://saucelabs.com/blog/index.php/2011/06/javascript-unit-testing-with-jellyfish-and-ondemand/
// https://github.com/admc/jellyfish/blob/master/test/fun/jfqunit.js

var tagCode = '<video id="vid1" controls class="video-js vjs-default-skin" preload="none" width="640" height="264" data-setup=\'{}\' poster="http://video-js.zencoder.com/oceans-clip.png">';
    tagCode+= '<source src="http://video-js.zencoder.com/oceans-clip.mp4" type="video/mp4">';
    tagCode+= '<source src="http://video-js.zencoder.com/oceans-clip.webm" type="video/webm">';
    tagCode+= '<source src="http://video-js.zencoder.com/oceans-clip.ogv" type="video/ogg; codecs=\'theora, vorbis\'">';
    tagCode+= '</video>';

function playerSetup(){
  document.body.innerHTML += tagCode;
  var vid = document.getElementById("vid1");
  this.player = _V_(vid);

  stop();
  this.player.ready(_V_.proxy(this, function(){
    start();
  }));
}

function playerTeardown(){
  _V_("vid1").destroy();
  document.body.removeChild(document.getElementById("vid1"));
}

module("Video.js setup", {
  setup: playerSetup,
  teardown: playerTeardown
});

test("Player Set Up", function() {
  ok(this.player);
});

/* Events
================================================================================ */
module("API Events", {
  setup: playerSetup,
  teardown: playerTeardown
});

var playEventList = []

// Test all playback events
test("Initial Events", 11, function() {
  stop(); // Give 30 seconds to run then fail.

  var events = [
    // "loadstart" // Called during setup
    "play",
    "playing",

    "durationchange",
    "loadedmetadata",
    "loadeddata",

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
      if (this.evt == "canplaythrough") {
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

/* Methods
================================================================================ */
module("API Methods", {
  setup: playerSetup,
  teardown: playerTeardown
});

// Play Method
test("play()", function() {
  this.player.addEvent("playing", _V_.proxy(this, function(){
    start();
    ok(true);
  }));
  this.player.play();
});

// Pause Method
test("pause()", function() {
  this.player.addEvent("pause", _V_.proxy(this, function(){
    start();
    ok(true);
  }));
  this.player.addEvent("playing", _V_.proxy(this, function(){
    this.player.pause();
  }));
  this.player.play();
});

// test("currentTime()", function() {
// 
//   // Need video loaded before we can call current time
//   this.player.addEvent("loadstart", _V_.proxy(this, function(){
//     start();
//     ok(true, "vid loading");
// 
//     // Watch for timeudpate
//     this.player.addEvent("timeupdate", _V_.proxy(this, function(){
//       start();
//       equal(this.player.currentTime(), 0, "time is 0");
//       this.player.removeEvent("timeupdate", arguments.callee);
// 
//       // Test again for later time
//       this.player.addEvent("timeupdate", _V_.proxy(this, function(){
//         start();
//         notEqual(this.player.currentTime(), 0, "time is not 0");
//         this.player.removeEvent("timeupdate", arguments.callee);
//       }));
//       // Stop and trigger time
//       stop();
//       this.player.currentTime(10);
// 
//     }));
//     // Stop and trigger time
//     stop();
//     this.player.currentTime(0);
// 
//   }));
// 
//   stop();
//   this.player.load();
// 
// 
// 
//   // Watch for timeudpate
//   this.player.addEvent("timeupdate", _V_.proxy(this, function(){
//     start();
//     notEqual(this.player.currentTime(), 0, "time is not 0");
//     this.player.removeEvent("timeupdate", arguments.callee);
//   }));
//   // Stop and trigger time
//   stop();
//   this.player.load();
// });