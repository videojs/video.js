var noop = function() {}, clock, oldTextTracks;

import Tech from '../../../src/js/tech/tech.js';
import Html5 from '../../../src/js/tech/html5.js';
import Flash from '../../../src/js/tech/flash.js';
import Button from '../../../src/js/button.js';
import { createTimeRange } from '../../../src/js/utils/time-ranges.js';
import extendFn from '../../../src/js/extend.js';
import MediaError from '../../../src/js/media-error.js';
import AudioTrack from '../../../src/js/tracks/audio-track';
import VideoTrack from '../../../src/js/tracks/video-track';
import TextTrack from '../../../src/js/tracks/text-track';
import AudioTrackList from '../../../src/js/tracks/audio-track-list';
import VideoTrackList from '../../../src/js/tracks/video-track-list';
import TextTrackList from '../../../src/js/tracks/text-track-list';

q.module('Media Tech', {
  'setup': function() {
    this.noop = function() {};
    this.clock = sinon.useFakeTimers();
    this.featuresProgessEvents = Tech.prototype['featuresProgessEvents'];
    Tech.prototype['featuresProgressEvents'] = false;
  },
  'teardown': function() {
    this.clock.restore();
    Tech.prototype['featuresProgessEvents'] = this.featuresProgessEvents;
  }
});

test('should synthesize timeupdate events by default', function() {
  var timeupdates = 0, tech;

  tech = new Tech();
  tech.on('timeupdate', function() {
    timeupdates++;
  });

  tech.trigger('play');

  this.clock.tick(250);
  equal(timeupdates, 1, 'triggered at least one timeupdate');
});

test('stops manual timeupdates while paused', function() {
  var timeupdates = 0, tech, expected;
  tech = new Tech();
  tech.on('timeupdate', function() {
    timeupdates++;
  });

  tech.trigger('play');
  this.clock.tick(10 * 250);
  ok(timeupdates > 0, 'timeupdates fire during playback');

  tech.trigger('pause');
  timeupdates = 0;
  this.clock.tick(10 * 250);
  equal(timeupdates, 0, 'timeupdates do not fire when paused');

  tech.trigger('play');
  this.clock.tick(10 * 250);
  ok(timeupdates > 0, 'timeupdates fire when playback resumes');
});

test('should synthesize progress events by default', function() {
  var progresses = 0, bufferedPercent = 0.5, tech;
  tech = new Tech();
  tech.on('progress', function() {
    progresses++;
  });
  tech.bufferedPercent = function() {
    return bufferedPercent;
  };

  this.clock.tick(500);
  equal(progresses, 0, 'waits until ready');

  tech.trigger('ready');
  this.clock.tick(500);
  equal(progresses, 1, 'triggered one event');

  tech.trigger('ready');
  bufferedPercent = 0.75;
  this.clock.tick(500);
  equal(progresses, 2, 'repeated readies are ok');
});

test('dispose() should stop time tracking', function() {
  var tech = new Tech();
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

test('dispose() should clear all tracks that are passed when its created', function() {
  var audioTracks = new AudioTrackList([new AudioTrack(), new AudioTrack()]);
  var videoTracks = new VideoTrackList([new VideoTrack(), new VideoTrack()]);
  var textTracks = new TextTrackList([new TextTrack({tech: {}}), new TextTrack({tech: {}})]);

  equal(audioTracks.length, 2, 'should have two audio tracks at the start');
  equal(videoTracks.length, 2, 'should have two video tracks at the start');
  equal(textTracks.length, 2, 'should have two text tracks at the start');

  var tech = new Tech({audioTracks, videoTracks, textTracks});
  equal(tech.videoTracks().length, videoTracks.length, 'should hold video tracks that we passed');
  equal(tech.audioTracks().length, audioTracks.length, 'should hold audio tracks that we passed');
  equal(tech.textTracks().length, textTracks.length, 'should hold text tracks that we passed');

  tech.dispose();

  equal(audioTracks.length, 0, 'should have zero audio tracks after dispose');
  equal(videoTracks.length, 0, 'should have zero video tracks after dispose');
  equal(textTracks.length, 0, 'should have zero text tracks after dispose');
});

test('dispose() should clear all tracks that are added after creation', function() {
  var tech = new Tech();

  tech.addRemoteTextTrack({});
  tech.addRemoteTextTrack({});

  tech.audioTracks().addTrack_(new AudioTrack());
  tech.audioTracks().addTrack_(new AudioTrack());

  tech.videoTracks().addTrack_(new VideoTrack());
  tech.videoTracks().addTrack_(new VideoTrack());

  equal(tech.audioTracks().length, 2, 'should have two audio tracks at the start');
  equal(tech.videoTracks().length, 2, 'should have two video tracks at the start');
  equal(tech.textTracks().length, 2, 'should have two video tracks at the start');
  equal(tech.remoteTextTrackEls().length, 2, 'should have two remote text tracks els');
  equal(tech.remoteTextTracks().length, 2, 'should have two remote text tracks');

  tech.dispose();

  equal(tech.audioTracks().length, 0, 'should have zero audio tracks after dispose');
  equal(tech.videoTracks().length, 0, 'should have zero video tracks after dispose');
  equal(tech.remoteTextTrackEls().length, 0, 'should have zero remote text tracks els');
  equal(tech.remoteTextTracks().length, 0, 'should have zero remote text tracks');
  equal(tech.textTracks().length, 0, 'should have zero video tracks after dispose');
});

test('should add the source handler interface to a tech', function(){
  var sourceA = { src: 'foo.mp4', type: 'video/mp4' };
  var sourceB = { src: 'no-support', type: 'no-support' };

  // Define a new tech class
  var MyTech = extendFn(Tech);

  // Extend Tech with source handlers
  Tech.withSourceHandlers(MyTech);

  // Check for the expected class methods
  ok(MyTech.registerSourceHandler, 'added a registerSourceHandler function to the Tech');
  ok(MyTech.selectSourceHandler, 'added a selectSourceHandler function to the Tech');

  // Create an instance of Tech
  var tech = new MyTech();

  // Check for the expected instance methods
  ok(tech.setSource, 'added a setSource function to the tech instance');

  // Create an internal state class for the source handler
  // The internal class would be used by a source handler to maintain state
  // and provde a dispose method for the handler.
  // This is optional for source handlers
  var disposeCalled = false;
  var handlerInternalState = function(){};
  handlerInternalState.prototype.dispose = function(){
    disposeCalled = true;
  };

  // Create source handlers
  var handlerOne = {
    canPlayType: function(type){
      if (type !=='no-support') {
        return 'probably';
      }
      return '';
    },
    canHandleSource: function(source, options){
      strictEqual(tech.options_, options, 'the tech options were passed to the source handler canHandleSource');
      if (source.type !=='no-support') {
        return 'probably';
      }
      return '';
    },
    handleSource: function(s, t, o){
      strictEqual(tech, t, 'the tech instance was passed to the source handler');
      strictEqual(sourceA, s, 'the tech instance was passed to the source handler');
      strictEqual(tech.options_, o, 'the tech options were passed to the source handler handleSource');
      return new handlerInternalState();
    }
  };

  var handlerTwo = {
    canPlayType: function(type){
      return ''; // no support
    },
    canHandleSource: function(source, options){
      return ''; // no support
    },
    handleSource: function(source, tech, options){
      ok(false, 'handlerTwo supports nothing and should never be called');
    }
  };

  // Test registering source handlers
  MyTech.registerSourceHandler(handlerOne);
  strictEqual(MyTech.sourceHandlers[0], handlerOne, 'handlerOne was added to the source handler array');
  MyTech.registerSourceHandler(handlerTwo, 0);
  strictEqual(MyTech.sourceHandlers[0], handlerTwo, 'handlerTwo was registered at the correct index (0)');

  // Test handler selection
  strictEqual(MyTech.selectSourceHandler(sourceA, tech.options_), handlerOne, 'handlerOne was selected to handle the valid source');
  strictEqual(MyTech.selectSourceHandler(sourceB, tech.options_), null, 'no handler was selected to handle the invalid source');

  // Test canPlayType return values
  strictEqual(MyTech.canPlayType(sourceA.type), 'probably', 'the Tech returned probably for the valid source');
  strictEqual(MyTech.canPlayType(sourceB.type), '', 'the Tech returned an empty string for the invalid source');

  // Test canPlaySource return values
  strictEqual(MyTech.canPlaySource(sourceA, tech.options_), 'probably', 'the Tech returned probably for the valid source');
  strictEqual(MyTech.canPlaySource(sourceB, tech.options_), '', 'the Tech returned an empty string for the invalid source');

  tech.addRemoteTextTrack({});
  tech.addRemoteTextTrack({});

  tech.audioTracks().addTrack_(new AudioTrack());
  tech.audioTracks().addTrack_(new AudioTrack());

  tech.videoTracks().addTrack_(new VideoTrack());
  tech.videoTracks().addTrack_(new VideoTrack());

  equal(tech.audioTracks().length, 2, 'should have two audio tracks at the start');
  equal(tech.videoTracks().length, 2, 'should have two video tracks at the start');
  equal(tech.textTracks().length, 2, 'should have two video tracks at the start');
  equal(tech.remoteTextTrackEls().length, 2, 'should have two remote text tracks els');
  equal(tech.remoteTextTracks().length, 2, 'should have two remote text tracks');

  // Pass a source through the source handler process of a tech instance
  tech.setSource(sourceA);

  // verify that the Tracks are still there
  equal(tech.audioTracks().length, 2, 'should have two audio tracks at the start');
  equal(tech.videoTracks().length, 2, 'should have two video tracks at the start');
  equal(tech.textTracks().length, 2, 'should have two video tracks at the start');
  equal(tech.remoteTextTrackEls().length, 2, 'should have two remote text tracks els');
  equal(tech.remoteTextTracks().length, 2, 'should have two remote text tracks');

  strictEqual(tech.currentSource_, sourceA, 'sourceA was handled and stored');
  ok(tech.sourceHandler_.dispose, 'the handlerOne state instance was stored');

  // Pass a second source
  tech.setSource(sourceA);
  strictEqual(tech.currentSource_, sourceA, 'sourceA was handled and stored');
  ok(tech.sourceHandler_.dispose, 'the handlerOne state instance was stored');

  // verify that all the tracks were removed as we got a new source
  equal(tech.audioTracks().length, 0, 'should have zero audio tracks');
  equal(tech.videoTracks().length, 0, 'should have zero video tracks');
  equal(tech.textTracks().length, 2, 'should have two text tracks');
  equal(tech.remoteTextTrackEls().length, 2, 'should have two remote text tracks els');
  equal(tech.remoteTextTracks().length, 2, 'should have two remote text tracks');

  // Check that the handler dipose method works
  ok(disposeCalled, 'dispose has been called for the handler yet');
  disposeCalled = false;
  tech.dispose();
  ok(disposeCalled, 'the handler dispose method was called when the tech was disposed');
});

test('should handle unsupported sources with the source handler API', function(){
  // Define a new tech class
  var MyTech = extendFn(Tech);
  // Extend Tech with source handlers
  Tech.withSourceHandlers(MyTech);
  // Create an instance of Tech
  var tech = new MyTech();

  var usedNative;
  MyTech.nativeSourceHandler = {
    handleSource: function(){ usedNative = true; }
  };

  tech.setSource('');
  ok(usedNative, 'native source handler was used when an unsupported source was set');
});

test('should allow custom error events to be set', function() {
  let tech = new Tech();
  let errors = [];
  tech.on('error', function() {
    errors.push(tech.error());
  });

  equal(tech.error(), null, 'error is null by default');

  tech.error(new MediaError(1));
  equal(errors.length, 1, 'triggered an error event');
  equal(errors[0].code, 1, 'set the proper code');

  tech.error(2);
  equal(errors.length, 2, 'triggered an error event');
  equal(errors[1].code, 2, 'wrapped the error code');
});

test('should track whether a video has played', function() {
  let tech = new Tech();

  equal(tech.played().length, 0, 'starts with zero length');
  tech.trigger('playing');
  equal(tech.played().length, 1, 'has length after playing');
});

test('delegates seekable to the source handler', function(){
  let MyTech = extendFn(Tech, {
    seekable: function() {
      throw new Error('You should not be calling me!');
    }
  });
  Tech.withSourceHandlers(MyTech);

  let seekableCount = 0;
  let handler = {
    seekable: function() {
      seekableCount++;
      return createTimeRange(0, 0);
    }
  };

  MyTech.registerSourceHandler({
    canPlayType: function() {
      return true;
    },
    canHandleSource: function() {
      return true;
    },
    handleSource: function(source, tech, options) {
      return handler;
    }
  });

  let tech = new MyTech();
  tech.setSource({
    src: 'example.mp4',
    type: 'video/mp4'
  });
  tech.seekable();
  equal(seekableCount, 1, 'called the source handler');
});

test('Tech.isTech returns correct answers for techs and components', function() {
  let isTech = Tech.isTech;

  ok(isTech(Tech), 'Tech is a Tech');
  ok(isTech(Html5), 'Html5 is a Tech');
  ok(isTech(new Html5({}, {})), 'An html5 instance is a Tech');
  ok(isTech(Flash), 'Flash is a Tech');
  ok(!isTech(5), 'A number is not a Tech');
  ok(!isTech('this is a tech'), 'A string is not a Tech');
  ok(!isTech(Button), 'A Button is not a Tech');
  ok(!isTech(new Button({}, {})), 'A Button instance is not a Tech');
  ok(!isTech(isTech), 'A function is not a Tech');
});

test('Tech#setSource clears currentSource_ after repeated loadstart', function() {
  let disposed = false;
  let MyTech = extendFn(Tech);

  Tech.withSourceHandlers(MyTech);
  let tech = new MyTech();

  var sourceHandler = {
    canPlayType: function(type) {
      return true;
    },
    canHandleSource: function(source, options) {
      return true;
    },
    handleSource: function(source, tech, options) {
      return {
        dispose: function() {
          disposed = true;
        }
      };
    }
  };

  // Test registering source handlers
  MyTech.registerSourceHandler(sourceHandler);

  // First loadstart
  tech.setSource('test');
  tech.currentSource_ = 'test';
  tech.trigger('loadstart');
  equal(tech.currentSource_, 'test', 'Current source is test');

  // Second loadstart
  tech.trigger('loadstart');
  equal(tech.currentSource_, null, 'Current source is null');
  equal(disposed, true, 'disposed is true');

  // Third loadstart
  tech.currentSource_ = 'test';
  tech.trigger('loadstart');
  equal(tech.currentSource_, null, 'Current source is still null');

});

test('setSource after tech dispose should dispose source handler once', function(){
  let MyTech = extendFn(Tech);
  Tech.withSourceHandlers(MyTech);

  let disposeCount = 0;
  let handler = {
    dispose() {
      disposeCount++;
    }
  };

  MyTech.registerSourceHandler({
    canPlayType: function() {
      return true;
    },
    canHandleSource: function() {
      return true;
    },
    handleSource: function(source, tech, options) {
      return handler;
    }
  });

  let tech = new MyTech();
  tech.setSource('test');

  equal(disposeCount, 0, 'did not call sourceHandler_ dispose for initial dispose');
  tech.dispose();
  ok(!tech.sourceHandler_, 'sourceHandler should be unset');
  equal(disposeCount, 1, 'called the source handler dispose');

  // this would normally be done above tech on src after dispose
  tech.el_ = tech.createEl();

  tech.setSource('test');
  equal(disposeCount, 1, 'did not dispose after initial setSource');

  tech.setSource('test');
  equal(disposeCount, 2, 'did dispose on second setSource');

});

test('setSource after previous setSource should dispose source handler once', function(){
  let MyTech = extendFn(Tech);
  Tech.withSourceHandlers(MyTech);

  let disposeCount = 0;
  let handler = {
    dispose() {
      disposeCount++;
    }
  };

  MyTech.registerSourceHandler({
    canPlayType: function() {
      return true;
    },
    canHandleSource: function() {
      return true;
    },
    handleSource: function(source, tech, options) {
      return handler;
    }
  });

  let tech = new MyTech();

  tech.setSource('test');
  equal(disposeCount, 0, 'did not call dispose for initial setSource');

  tech.setSource('test');
  equal(disposeCount, 1, 'did dispose for second setSource');

  tech.setSource('test');
  equal(disposeCount, 2, 'did dispose for third setSource');

});

