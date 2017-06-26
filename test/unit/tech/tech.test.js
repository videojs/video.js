/* eslint-env qunit */
import Tech from '../../../src/js/tech/tech.js';
import Html5 from '../../../src/js/tech/html5.js';
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
import sinon from 'sinon';
import log from '../../../src/js/utils/log.js';

QUnit.module('Media Tech', {
  beforeEach(assert) {
    this.noop = function() {};
    this.clock = sinon.useFakeTimers();
    this.featuresProgessEvents = Tech.prototype.featuresProgessEvents;
    Tech.prototype.featuresProgressEvents = false;
  },
  afterEach(assert) {
    this.clock.restore();
    Tech.prototype.featuresProgessEvents = this.featuresProgessEvents;
  }
});

QUnit.test('Tech.registerTech and Tech.getTech', function(assert) {
  const MyTech = extendFn(Tech);
  const oldTechs = Tech.techs_;
  const oldDefaultTechOrder = Tech.defaultTechOrder_;

  Tech.registerTech('MyTech', MyTech);

  assert.ok(Tech.techs_.MyTech, 'Tech is stored in the global list');
  assert.notEqual(Tech.defaultTechOrder_.indexOf('MyTech'), -1, 'Tech is stored in the defaultTechOrder array');
  assert.strictEqual(Tech.getTech('myTech'), MyTech, 'can get a tech using `camelCase` name');
  assert.strictEqual(Tech.getTech('MyTech'), MyTech, 'can get a tech using `titleCase` name');

  // reset techs and defaultTechOrder
  Tech.techs_ = oldTechs;
  Tech.defaultTechOrder_ = oldDefaultTechOrder;
});

QUnit.test('should synthesize timeupdate events by default', function(assert) {
  let timeupdates = 0;
  const tech = new Tech();

  tech.on('timeupdate', function() {
    timeupdates++;
  });

  tech.trigger('play');

  this.clock.tick(250);
  assert.equal(timeupdates, 1, 'triggered at least one timeupdate');
});

QUnit.test('stops manual timeupdates while paused', function(assert) {
  let timeupdates = 0;
  const tech = new Tech();

  tech.on('timeupdate', function() {
    timeupdates++;
  });

  tech.trigger('play');
  this.clock.tick(10 * 250);
  assert.ok(timeupdates > 0, 'timeupdates fire during playback');

  tech.trigger('pause');
  timeupdates = 0;
  this.clock.tick(10 * 250);
  assert.equal(timeupdates, 0, 'timeupdates do not fire when paused');

  tech.trigger('play');
  this.clock.tick(10 * 250);
  assert.ok(timeupdates > 0, 'timeupdates fire when playback resumes');
});

QUnit.test('should synthesize progress events by default', function(assert) {
  let progresses = 0;
  let bufferedPercent = 0.5;
  const tech = new Tech();

  tech.on('progress', function() {
    progresses++;
  });
  tech.bufferedPercent = function() {
    return bufferedPercent;
  };

  this.clock.tick(500);
  assert.equal(progresses, 0, 'waits until ready');

  tech.trigger('ready');
  this.clock.tick(500);
  assert.equal(progresses, 1, 'triggered one event');

  tech.trigger('ready');
  bufferedPercent = 0.75;
  this.clock.tick(500);
  assert.equal(progresses, 2, 'repeated readies are ok');
});

QUnit.test('dispose() should stop time tracking', function(assert) {
  const tech = new Tech();

  tech.dispose();

  // progress and timeupdate events will throw exceptions after the
  // tech is disposed
  try {
    this.clock.tick(10 * 1000);
  } catch (e) {
    return assert.equal(e, undefined, 'threw an exception');
  }
  assert.ok(true, 'no exception was thrown');
});

QUnit.test('dispose() should clear all tracks that are passed when its created', function(assert) {
  const audioTracks = new AudioTrackList([new AudioTrack(), new AudioTrack()]);
  const videoTracks = new VideoTrackList([new VideoTrack(), new VideoTrack()]);
  const textTracks = new TextTrackList([new TextTrack({tech: {}}),
                                        new TextTrack({tech: {}})]);

  assert.equal(audioTracks.length, 2, 'should have two audio tracks at the start');
  assert.equal(videoTracks.length, 2, 'should have two video tracks at the start');
  assert.equal(textTracks.length, 2, 'should have two text tracks at the start');

  const tech = new Tech({audioTracks, videoTracks, textTracks});

  assert.equal(tech.videoTracks().length,
              videoTracks.length,
              'should hold video tracks that we passed');
  assert.equal(tech.audioTracks().length,
              audioTracks.length,
              'should hold audio tracks that we passed');
  assert.equal(tech.textTracks().length,
              textTracks.length,
              'should hold text tracks that we passed');

  tech.dispose();

  assert.equal(audioTracks.length, 0, 'should have zero audio tracks after dispose');
  assert.equal(videoTracks.length, 0, 'should have zero video tracks after dispose');
  assert.equal(textTracks.length, 0, 'should have zero text tracks after dispose');
});

QUnit.test('dispose() should clear all tracks that are added after creation', function(assert) {
  const tech = new Tech();

  tech.addRemoteTextTrack({}, true);
  tech.addRemoteTextTrack({}, true);

  tech.audioTracks().addTrack(new AudioTrack());
  tech.audioTracks().addTrack(new AudioTrack());

  tech.videoTracks().addTrack(new VideoTrack());
  tech.videoTracks().addTrack(new VideoTrack());

  assert.equal(tech.audioTracks().length, 2, 'should have two audio tracks at the start');
  assert.equal(tech.videoTracks().length, 2, 'should have two video tracks at the start');
  assert.equal(tech.textTracks().length, 2, 'should have two text tracks at the start');
  assert.equal(tech.remoteTextTrackEls().length,
              2,
              'should have two remote text tracks els');
  assert.equal(tech.remoteTextTracks().length, 2, 'should have two remote text tracks');

  tech.dispose();

  assert.equal(tech.audioTracks().length,
              0,
              'should have zero audio tracks after dispose');
  assert.equal(tech.videoTracks().length,
              0,
              'should have zero video tracks after dispose');
  assert.equal(tech.remoteTextTrackEls().length,
              0,
              'should have zero remote text tracks els');
  assert.equal(tech.remoteTextTracks().length, 0, 'should have zero remote text tracks');
  assert.equal(tech.textTracks().length, 0, 'should have zero video tracks after dispose');
});

QUnit.test('switching sources should clear all remote tracks that are added with manualCleanup = false', function(assert) {

  const oldLogWarn = log.warn;
  let warning;

  log.warn = function(wrning) {
    warning = wrning;
  };

  // Define a new tech class
  const MyTech = extendFn(Tech);

  // Create source handler
  const handler = {
    canPlayType: () => 'probably',
    canHandleSource: () => 'probably',
    handleSource: () => {
      return {
        dispose: () => {}
      };
    }
  };

  // Extend Tech with source handlers
  Tech.withSourceHandlers(MyTech);

  MyTech.registerSourceHandler(handler);

  const tech = new MyTech();

  tech.triggerReady();

  // set the initial source
  tech.setSource({src: 'foo.mp4', type: 'mp4'});

  // default value for manualCleanup is true
  tech.addRemoteTextTrack({});
  this.clock.tick(1);

  assert.equal(warning,
               'Calling addRemoteTextTrack without explicitly setting the "manualCleanup" parameter to `true` is deprecated and default to `false` in future version of video.js',
               'we log a warning when `addRemoteTextTrack` is called without a manualCleanup argument');

  // should be automatically cleaned up when source changes
  tech.addRemoteTextTrack({}, false);
  this.clock.tick(1);

  assert.equal(tech.textTracks().length, 2, 'should have two text tracks at the start');
  assert.equal(tech.remoteTextTrackEls().length,
              2,
              'should have two remote text tracks els');
  assert.equal(tech.remoteTextTracks().length, 2, 'should have two remote text tracks');
  assert.equal(tech.autoRemoteTextTracks_.length,
               1,
               'should have one auto-cleanup remote text track');

  // change source to force cleanup of auto remote text tracks
  tech.setSource({src: 'bar.mp4', type: 'mp4'});
  this.clock.tick(1);

  assert.equal(tech.textTracks().length,
               1,
               'should have one text track after source change');
  assert.equal(tech.remoteTextTrackEls().length,
              1,
              'should have one remote remote text track els after source change');
  assert.equal(tech.remoteTextTracks().length,
               1,
               'should have one remote text track after source change');
  assert.equal(tech.autoRemoteTextTracks_.length,
               0,
               'should have zero auto-cleanup remote text tracks');

  log.warn = oldLogWarn;
});

QUnit.test('should add the source handler interface to a tech', function(assert) {
  const sourceA = { src: 'foo.mp4', type: 'video/mp4' };
  const sourceB = { src: 'no-support', type: 'no-support' };

  // Define a new tech class
  const MyTech = extendFn(Tech);

  // Extend Tech with source handlers
  Tech.withSourceHandlers(MyTech);

  // Check for the expected class methods
  assert.ok(MyTech.registerSourceHandler,
           'added a registerSourceHandler function to the Tech');
  assert.ok(MyTech.selectSourceHandler,
           'added a selectSourceHandler function to the Tech');

  // Create an instance of Tech
  const tech = new MyTech();

  // Check for the expected instance methods
  assert.ok(tech.setSource, 'added a setSource function to the tech instance');

  // Create an internal state class for the source handler
  // The internal class would be used by a source handler to maintain state
  // and provde a dispose method for the handler.
  // This is optional for source handlers
  let disposeCalled = false;
  const HandlerInternalState = function() {};

  HandlerInternalState.prototype.dispose = function() {
    disposeCalled = true;
  };

  // Create source handlers
  const handlerOne = {
    canPlayType(type) {
      if (type !== 'no-support') {
        return 'probably';
      }
      return '';
    },
    canHandleSource(source, options) {
      assert.strictEqual(tech.options_,
                        options,
                        'tech options passed to canHandleSource');
      if (source.type !== 'no-support') {
        return 'probably';
      }
      return '';
    },
    handleSource(s, t, o) {
      assert.strictEqual(tech,
                        t,
                        'tech instance passed to source handler');
      assert.strictEqual(sourceA,
                        s,
                        'tech instance passed to the source handler');
      assert.strictEqual(tech.options_,
                        o,
                        'tech options passed to the source handler handleSource');
      return new HandlerInternalState();
    }
  };

  const handlerTwo = {
    canPlayType(type) {
      // no support
      return '';
    },
    canHandleSource(source, options) {
      // no support
      return '';
    },
    handleSource(source, tech_, options) {
      assert.ok(false, 'handlerTwo supports nothing and should never be called');
    }
  };

  // Test registering source handlers
  MyTech.registerSourceHandler(handlerOne);
  assert.strictEqual(MyTech.sourceHandlers[0],
                    handlerOne,
                    'handlerOne was added to the source handler array');
  MyTech.registerSourceHandler(handlerTwo, 0);
  assert.strictEqual(MyTech.sourceHandlers[0],
                    handlerTwo,
                    'handlerTwo was registered at the correct index (0)');

  // Test handler selection
  assert.strictEqual(MyTech.selectSourceHandler(sourceA, tech.options_),
                    handlerOne,
                    'handlerOne was selected to handle the valid source');
  assert.strictEqual(MyTech.selectSourceHandler(sourceB, tech.options_),
                    null,
                    'no handler was selected to handle the invalid source');

  // Test canPlayType return values
  assert.strictEqual(MyTech.canPlayType(sourceA.type),
                    'probably',
                    'the Tech returned probably for the valid source');
  assert.strictEqual(MyTech.canPlayType(sourceB.type),
                    '',
                    'the Tech returned an empty string for the invalid source');

  // Test canPlaySource return values
  assert.strictEqual(MyTech.canPlaySource(sourceA, tech.options_),
                    'probably',
                    'the Tech returned probably for the valid source');
  assert.strictEqual(MyTech.canPlaySource(sourceB, tech.options_),
                    '',
                    'the Tech returned an empty string for the invalid source');

  tech.addRemoteTextTrack({}, true);
  tech.addRemoteTextTrack({}, true);

  tech.audioTracks().addTrack(new AudioTrack());
  tech.audioTracks().addTrack(new AudioTrack());

  tech.videoTracks().addTrack(new VideoTrack());
  tech.videoTracks().addTrack(new VideoTrack());

  assert.equal(tech.audioTracks().length, 2, 'should have two audio tracks at the start');
  assert.equal(tech.videoTracks().length, 2, 'should have two video tracks at the start');
  assert.equal(tech.textTracks().length, 2, 'should have two video tracks at the start');
  assert.equal(tech.remoteTextTrackEls().length,
              2,
              'should have two remote text tracks els');
  assert.equal(tech.remoteTextTracks().length, 2, 'should have two remote text tracks');

  // Pass a source through the source handler process of a tech instance
  tech.setSource(sourceA);

  // verify that the Tracks are still there
  assert.equal(tech.audioTracks().length, 2, 'should have two audio tracks at the start');
  assert.equal(tech.videoTracks().length, 2, 'should have two video tracks at the start');
  assert.equal(tech.textTracks().length, 2, 'should have two video tracks at the start');
  assert.equal(tech.remoteTextTrackEls().length,
              2,
              'should have two remote text tracks els');
  assert.equal(tech.remoteTextTracks().length, 2, 'should have two remote text tracks');

  assert.strictEqual(tech.currentSource_, sourceA, 'sourceA was handled and stored');
  assert.ok(tech.sourceHandler_.dispose, 'the handlerOne state instance was stored');

  // Pass a second source
  tech.setSource(sourceA);
  assert.strictEqual(tech.currentSource_, sourceA, 'sourceA was handled and stored');
  assert.ok(tech.sourceHandler_.dispose, 'the handlerOne state instance was stored');

  // verify that all the tracks were removed as we got a new source
  assert.equal(tech.audioTracks().length, 0, 'should have zero audio tracks');
  assert.equal(tech.videoTracks().length, 0, 'should have zero video tracks');
  assert.equal(tech.textTracks().length, 2, 'should have two text tracks');
  assert.equal(tech.remoteTextTrackEls().length,
              2,
              'should have two remote text tracks els');
  assert.equal(tech.remoteTextTracks().length, 2, 'should have two remote text tracks');

  // Check that the handler dipose method works
  assert.ok(disposeCalled, 'dispose has been called for the handler yet');
  disposeCalled = false;
  tech.dispose();
  assert.ok(disposeCalled,
           'the handler dispose method was called when the tech was disposed');
});

QUnit.test('should handle unsupported sources with the source handler API', function(assert) {
  // Define a new tech class
  const MyTech = extendFn(Tech);

  // Extend Tech with source handlers
  Tech.withSourceHandlers(MyTech);
  // Create an instance of Tech
  const tech = new MyTech();
  let usedNative;

  MyTech.nativeSourceHandler = {
    handleSource() {
      usedNative = true;
    }
  };

  tech.setSource('');
  assert.ok(usedNative,
           'native source handler was used when an unsupported source was set');
});

QUnit.test('should allow custom error events to be set', function(assert) {
  const tech = new Tech();
  const errors = [];

  tech.on('error', function() {
    errors.push(tech.error());
  });

  assert.equal(tech.error(), null, 'error is null by default');

  tech.error(new MediaError(1));
  assert.equal(errors.length, 1, 'triggered an error event');
  assert.equal(errors[0].code, 1, 'set the proper code');

  tech.error(2);
  assert.equal(errors.length, 2, 'triggered an error event');
  assert.equal(errors[1].code, 2, 'wrapped the error code');
});

QUnit.test('should track whether a video has played', function(assert) {
  const tech = new Tech();

  assert.equal(tech.played().length, 0, 'starts with zero length');
  tech.trigger('playing');
  assert.equal(tech.played().length, 1, 'has length after playing');
});

QUnit.test('delegates seekable to the source handler', function(assert) {
  const MyTech = extendFn(Tech, {
    seekable() {
      throw new Error('You should not be calling me!');
    }
  });

  Tech.withSourceHandlers(MyTech);

  let seekableCount = 0;
  const handler = {
    seekable() {
      seekableCount++;
      return createTimeRange(0, 0);
    }
  };

  MyTech.registerSourceHandler({
    canPlayType() {
      return true;
    },
    canHandleSource() {
      return true;
    },
    handleSource(source, tech, options) {
      return handler;
    }
  });

  const tech = new MyTech();

  tech.setSource({
    src: 'example.mp4',
    type: 'video/mp4'
  });
  tech.seekable();
  assert.equal(seekableCount, 1, 'called the source handler');
});

QUnit.test('Tech.isTech returns correct answers for techs and components', function(assert) {
  const isTech = Tech.isTech;

  assert.ok(isTech(Tech), 'Tech is a Tech');
  assert.ok(isTech(Html5), 'Html5 is a Tech');
  assert.ok(isTech(new Html5({}, {})), 'An html5 instance is a Tech');
  assert.ok(!isTech(5), 'A number is not a Tech');
  assert.ok(!isTech('this is a tech'), 'A string is not a Tech');
  assert.ok(!isTech(Button), 'A Button is not a Tech');
  assert.ok(!isTech(new Button({}, {})), 'A Button instance is not a Tech');
  assert.ok(!isTech(isTech), 'A function is not a Tech');
});

QUnit.test('setSource after tech dispose should dispose source handler once', function(assert) {
  const MyTech = extendFn(Tech);

  Tech.withSourceHandlers(MyTech);

  let disposeCount = 0;
  const handler = {
    dispose() {
      disposeCount++;
    }
  };

  MyTech.registerSourceHandler({
    canPlayType() {
      return true;
    },
    canHandleSource() {
      return true;
    },
    handleSource(source, tech, options) {
      return handler;
    }
  });

  const tech = new MyTech();

  tech.setSource('test');

  assert.equal(disposeCount, 0, 'did not call sourceHandler_ dispose for initial dispose');
  tech.dispose();
  assert.ok(!tech.sourceHandler_, 'sourceHandler should be unset');
  assert.equal(disposeCount, 1, 'called the source handler dispose');

  // this would normally be done above tech on src after dispose
  tech.el_ = tech.createEl();

  tech.setSource('test');
  assert.equal(disposeCount, 1, 'did not dispose after initial setSource');

  tech.setSource('test');
  assert.equal(disposeCount, 2, 'did dispose on second setSource');

});

QUnit.test('setSource after previous setSource should dispose source handler once', function(assert) {
  const MyTech = extendFn(Tech);

  Tech.withSourceHandlers(MyTech);

  let disposeCount = 0;
  const handler = {
    dispose() {
      disposeCount++;
    }
  };

  MyTech.registerSourceHandler({
    canPlayType() {
      return true;
    },
    canHandleSource() {
      return true;
    },
    handleSource(source, tech, options) {
      return handler;
    }
  });

  const tech = new MyTech();

  tech.setSource('test');
  assert.equal(disposeCount, 0, 'did not call dispose for initial setSource');

  tech.setSource('test');
  assert.equal(disposeCount, 1, 'did dispose for second setSource');

  tech.setSource('test');
  assert.equal(disposeCount, 2, 'did dispose for third setSource');

});

QUnit.test('returns an empty object for getVideoPlaybackQuality', function(assert) {
  const tech = new Tech();

  assert.deepEqual(tech.getVideoPlaybackQuality(), {}, 'returns an empty object');
});
