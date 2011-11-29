var tagCode = '<video id="vid1" class="video-js vjs-default-skin" preload="none" width="640" height="264" data-setup=\'{}\' poster="http://video-js.zencoder.com/oceans-clip.png">';
    tagCode+= '<source src="http://video-js.zencoder.com/oceans-clip.mp4" type="video/mp4">';
    tagCode+= '<source src="http://video-js.zencoder.com/oceans-clip.webm" type="video/webm">';
    tagCode+= '<source src="http://video-js.zencoder.com/oceans-clip.ogv" type="video/ogg; codecs=\'theora, vorbis\'">';
    tagCode+= '<track kind="subtitles" src="http://videojs.com/subtitles/demo-subtitles.srt" srclang="en-US" label="English"></track>';
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
  document.body.removeChild(document.getElementById("vid1"));
  ok(!document.getElementById("vid1"), "torndown");
}

module("video.js setup", {
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

// Play Event
test("play", function() {
  this.player.addEvent("play", _V_.proxy(this, function(){
    start();
    ok(true);
  }));
  this.player.play();
});

// Playing Event
test("playing", function() {
  this.player.addEvent("playing", _V_.proxy(this, function(){
    start();
    ok(true, "playing");
  }));
  this.player.play();
});

// Pause Event
test("pause", function() {
  this.player.addEvent("pause", _V_.proxy(this, function(){
    start();
    ok(true);
  }));
  this.player.addEvent("playing", _V_.proxy(this, function(){
    this.player.pause();
  }));
  this.player.play();
});

// Pause Event
test("timeupdate", function() {
  this.player.addEvent("timeupdate", _V_.proxy(this, function(){
    start();
    ok(true);
  }));
  this.player.addEvent("playing", _V_.proxy(this, function(){
    this.player.pause();
  }));
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

test("currentTime()", function() {

  // Need video loaded before we can call current time
  this.player.addEvent("loadstart", _V_.proxy(this, function(){
    start();
    ok(true, "vid loading");

    // Watch for timeudpate
    this.player.addEvent("timeupdate", _V_.proxy(this, function(){
      start();
      equal(this.player.currentTime(), 0, "time is 0");
      this.player.removeEvent("timeupdate", arguments.callee);

      // Test again for later time
      this.player.addEvent("timeupdate", _V_.proxy(this, function(){
        start();
        notEqual(this.player.currentTime(), 0, "time is not 0");
        this.player.removeEvent("timeupdate", arguments.callee);
      }));
      // Stop and trigger time
      stop();
      this.player.currentTime(10);

    }));
    // Stop and trigger time
    stop();
    this.player.currentTime(0);

  }));

  stop();
  this.player.load();



  // Watch for timeudpate
  this.player.addEvent("timeupdate", _V_.proxy(this, function(){
    start();
    notEqual(this.player.currentTime(), 0, "time is not 0");
    this.player.removeEvent("timeupdate", arguments.callee);
  }));
  // Stop and trigger time
  stop();
  this.player.load();
});