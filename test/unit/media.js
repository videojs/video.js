module('Media Tech', {
  'setup': function() {
    this.noop = function() {};
    this.clock = sinon.useFakeTimers();
    this.featuresProgessEvents = videojs.MediaTechController.prototype['featuresProgessEvents'];
    videojs.MediaTechController.prototype['featuresProgressEvents'] = false;
  },
  'teardown': function() {
    this.clock.restore();
    videojs.MediaTechController.prototype['featuresProgessEvents'] = this.featuresProgessEvents;
  }
});

test('should synthesize timeupdate events by default', function() {
  var timeupdates = 0, playHandler, i, tech;
  tech = new videojs.MediaTechController({
    id: this.noop,
    on: function(event, handler) {
      if (event === 'play') {
        playHandler = handler;
      }
    },
    trigger: function(event) {
      if (event === 'timeupdate') {
        timeupdates++;
      }
    }
  });
  playHandler.call(tech);
  tech.on('timeupdate', function() {
    timeupdates++;
  });

  this.clock.tick(250);
  equal(timeupdates, 1, 'triggered one timeupdate');
});

test('stops timeupdates if the tech produces them natively', function() {
  var timeupdates = 0, tech, playHandler, expected;
  tech = new videojs.MediaTechController({
    id: this.noop,
    on: function(event, handler) {
      if (event === 'play') {
        playHandler = handler;
      }
    },
    bufferedPercent: this.noop,
    trigger: function(event) {
      if (event === 'timeupdate') {
        timeupdates++;
      }
    }
  });

  playHandler.call(tech);
  // simulate a native timeupdate event
  tech.trigger('timeupdate');

  expected = timeupdates;
  this.clock.tick(10 * 1000);
  equal(timeupdates, expected, 'did not simulate timeupdates');
});

test('stops manual timeupdates while paused', function() {
  var timeupdates = 0, tech, playHandler, pauseHandler, expected;
  tech = new videojs.MediaTechController({
    id: this.noop,
    on: function(event, handler) {
      if (event === 'play') {
        playHandler = handler;
      } else if (event === 'pause') {
        pauseHandler = handler;
      }
    },
    bufferedPercent: this.noop,
    trigger: function(event) {
      if (event === 'timeupdate') {
        timeupdates++;
      }
    }
  });
  playHandler.call(tech);
  this.clock.tick(10 * 250);
  ok(timeupdates > 0, 'timeupdates fire during playback');

  pauseHandler.call(tech);
  timeupdates = 0;
  this.clock.tick(10 * 250);
  equal(timeupdates, 0, 'timeupdates do not fire when paused');

  playHandler.call(tech);
  this.clock.tick(10 * 250);
  ok(timeupdates > 0, 'timeupdates fire when playback resumes');
});

test('should synthesize progress events by default', function() {
  var progresses = 0, tech;
  tech = new videojs.MediaTechController({
    id: this.noop,
    on: this.noop,
    bufferedPercent: function() {
      return 0;
    },
    trigger: function(event) {
      if (event === 'progress') {
        progresses++;
      }
    }
  });
  tech.on('progress', function() {
    progresses++;
  });

  this.clock.tick(500);
  equal(progresses, 1, 'triggered one event');
});

test('dispose() should stop time tracking', function() {
  var tech = new videojs.MediaTechController({
    id: this.noop,
    on: this.noop,
    off: this.noop,
    trigger: this.noop
  });
  tech.dispose();

  // progress and timeupdate events will throw exceptions after the
  // tech is disposed
  try {
    this.clock.tick(10 * 1000);
  } catch (e) {
    return equal(e, undefined, 'threw an exception');
  }
  ok(true, 'no exception was thrown');
});
