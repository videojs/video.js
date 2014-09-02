var noop = function() {}, clock, progessEventsFeature;

module('Media Tech', {
  'setup': function() {
    clock = sinon.useFakeTimers();
    progessEventsFeature = videojs.MediaTechController.prototype['progessEventsFeature'];
    videojs.MediaTechController.prototype['progressEventsFeature'] = false;
  },
  'teardown': function() {
    clock.restore();
    videojs.MediaTechController.prototype['progessEventsFeature'] = progessEventsFeature;
  }
});

test('should synthesize timeupdate events by default', function() {
  var timeupdates = 0, playHandler, i, tech;
  tech = new videojs.MediaTechController({
    id: noop,
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

  clock.tick(250);
  equal(timeupdates, 1, 'triggered one timeupdate');
});

test('stops timeupdates if the tech produces them natively', function() {
  var timeupdates = 0, tech, playHandler, expected;
  tech = new videojs.MediaTechController({
    id: noop,
    on: function(event, handler) {
      if (event === 'play') {
        playHandler = handler;
      }
    },
    bufferedPercent: noop,
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
  clock.tick(10 * 1000);
  equal(timeupdates, expected, 'did not simulate timeupdates');
});

test('stops manual timeupdates while paused', function() {
  var timeupdates = 0, tech, playHandler, pauseHandler, expected;
  tech = new videojs.MediaTechController({
    id: noop,
    on: function(event, handler) {
      if (event === 'play') {
        playHandler = handler;
      } else if (event === 'pause') {
        pauseHandler = handler;
      }
    },
    bufferedPercent: noop,
    trigger: function(event) {
      if (event === 'timeupdate') {
        timeupdates++;
      }
    }
  });
  playHandler.call(tech);
  clock.tick(10 * 250);
  ok(timeupdates > 0, 'timeupdates fire during playback');

  pauseHandler.call(tech);
  timeupdates = 0;
  clock.tick(10 * 250);
  equal(timeupdates, 0, 'timeupdates do not fire when paused');

  playHandler.call(tech);
  clock.tick(10 * 250);
  ok(timeupdates > 0, 'timeupdates fire when playback resumes');
});

test('should synthesize progress events by default', function() {
  var progresses = 0, tech;
  tech = new videojs.MediaTechController({
    id: noop,
    on: noop,
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

  clock.tick(500);
  equal(progresses, 1, 'triggered one event');
});

test('dispose() should stop time tracking', function() {
  var tech = new videojs.MediaTechController({
    id: noop,
    on: noop,
    trigger: noop
  });
  tech.dispose();

  // progress and timeupdate events will throw exceptions after the
  // tech is disposed
  try {
    clock.tick(10 * 1000);
  } catch (e) {
    return equal(e, undefined, 'threw an exception');
  }
  ok(true, 'no exception was thrown');
});
