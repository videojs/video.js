var noop = function() {}, clock, oldTextTracks;

module('Media Tech', {
  'setup': function() {
    this.noop = function() {};
    this.clock = sinon.useFakeTimers();
    this.featuresProgessEvents = videojs.MediaTechController.prototype['featuresProgessEvents'];
    videojs.MediaTechController.prototype['featuresProgressEvents'] = false;
    videojs.MediaTechController.prototype['featuresNativeTextTracks'] = true;
    oldTextTracks = videojs.MediaTechController.prototype.textTracks;
    videojs.MediaTechController.prototype.textTracks = function() {
      return {
        addEventListener: Function.prototype,
        removeEventListener: Function.prototype
      };
    };
  },
  'teardown': function() {
    this.clock.restore();
    videojs.MediaTechController.prototype['featuresProgessEvents'] = this.featuresProgessEvents;
    videojs.MediaTechController.prototype['featuresNativeTextTracks'] = false;
    videojs.MediaTechController.prototype.textTracks = oldTextTracks;
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
    off: this.noop,
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

test('should add the source hanlder interface to a tech', function(){
  var mockPlayer = {
    off: this.noop,
    trigger: this.noop
  };
  var sourceA = { src: 'foo.mp4', type: 'video/mp4' };
  var sourceB = { src: 'no-support', type: 'no-support' };

  // Define a new tech class
  var Tech = videojs.MediaTechController.extend();

  // Extend Tech with source handlers
  vjs.MediaTechController['withSourceHandlers'](Tech);

  // Check for the expected class methods
  ok(Tech['registerSourceHandler'], 'added a registerSourceHandler function to the Tech');
  ok(Tech.selectSourceHandler, 'added a selectSourceHandler function to the Tech');

  // Create an instance of Tech
  var tech = new Tech(mockPlayer);

  // Check for the expected instance methods
  ok(tech.setSource, 'added a setSource function to the tech instance');

  // Create an internal state class for the source handler
  // The internal class would be used by a source hanlder to maintain state
  // and provde a dispose method for the handler.
  // This is optional for source handlers
  var disposeCalled = false;
  var handlerInternalState = function(){};
  handlerInternalState.prototype.dispose = function(){
    disposeCalled = true;
  };

  // Create source handlers
  var handlerOne = {
    'canHandleSource': function(source){
      if (source.type !=='no-support') {
        return 'probably';
      }
      return '';
    },
    'handleSource': function(s, t){
      strictEqual(tech, t, 'the tech instance was passed to the source handler');
      strictEqual(sourceA, s, 'the tech instance was passed to the source handler');
      return new handlerInternalState();
    }
  };

  var handlerTwo = {
    'canHandleSource': function(source){
      return ''; // no support
    },
    'handleSource': function(source, tech){
      ok(false, 'handlerTwo supports nothing and should never be called');
    }
  };

  // Test registering source handlers
  Tech['registerSourceHandler'](handlerOne);
  strictEqual(Tech.sourceHandlers[0], handlerOne, 'handlerOne was added to the source handler array');
  Tech['registerSourceHandler'](handlerTwo, 0);
  strictEqual(Tech.sourceHandlers[0], handlerTwo, 'handlerTwo was registered at the correct index (0)');

  // Test handler selection
  strictEqual(Tech.selectSourceHandler(sourceA), handlerOne, 'handlerOne was selected to handle the valid source');
  strictEqual(Tech.selectSourceHandler(sourceB), null, 'no handler was selected to handle the invalid source');

  // Test canPlaySource return values
  strictEqual(Tech.canPlaySource(sourceA), 'probably', 'the Tech returned probably for the valid source');
  strictEqual(Tech.canPlaySource(sourceB), '', 'the Tech returned an empty string for the invalid source');

  // Pass a source through the source handler process of a tech instance
  tech.setSource(sourceA);
  strictEqual(tech.currentSource_, sourceA, 'sourceA was handled and stored');
  ok(tech.sourceHandler_.dispose, 'the handlerOne state instance was stored');

  // Check that the handler dipose method works
  ok(!disposeCalled, 'dispose has not been called for the handler yet');
  tech.dispose();
  ok(disposeCalled, 'the handler dispose method was called when the tech was disposed');
});

test('should handle unsupported sources with the source handler API', function(){
  var mockPlayer = {
    off: this.noop,
    trigger: this.noop
  };

  // Define a new tech class
  var Tech = videojs.MediaTechController.extend();
  // Extend Tech with source handlers
  vjs.MediaTechController['withSourceHandlers'](Tech);
  // Create an instance of Tech
  var tech = new Tech(mockPlayer);

  var usedNative;
  Tech['nativeSourceHandler'] = {
    'handleSource': function(){ usedNative = true; }
  };

  tech.setSource('');
  ok(usedNative, 'native source handler was used when an unsupported source was set');
});
