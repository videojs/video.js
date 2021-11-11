/* eslint-env qunit */
import TestHelpers from './test-helpers.js';
import {createTimeRanges} from '../../src/js/utils/time-ranges.js';
import sinon from 'sinon';

QUnit.module('LiveTracker', () => {
  QUnit.module('options', {
    beforeEach() {
      this.clock = sinon.useFakeTimers();
    },
    afterEach() {
      this.player.dispose();
      this.clock.restore();
    }
  });

  QUnit.test('liveui true, trackingThreshold is met', function(assert) {
    this.player = TestHelpers.makePlayer({liveui: true});
    this.player.seekable = () => createTimeRanges(0, 30);

    this.player.duration(Infinity);

    assert.ok(this.player.hasClass('vjs-liveui'), 'has vjs-liveui');
    assert.ok(this.player.liveTracker.isTracking(), 'is tracking');
  });

  QUnit.test('liveui true, trackingThreshold is not met', function(assert) {
    this.player = TestHelpers.makePlayer({liveui: true, liveTracker: {trackingThreshold: 31}});
    this.player.seekable = () => createTimeRanges(0, 30);

    this.player.duration(Infinity);

    assert.notOk(this.player.hasClass('vjs-liveui'), 'does not have vjs-iveui');
    assert.notOk(this.player.liveTracker.isTracking(), 'is not tracking');
  });

  QUnit.test('liveui false, trackingThreshold is met', function(assert) {
    this.player = TestHelpers.makePlayer({liveui: false});
    this.player.seekable = () => createTimeRanges(0, 30);

    this.player.duration(Infinity);

    assert.notOk(this.player.hasClass('vjs-liveui'), 'does not have vjs-liveui');
    assert.ok(this.player.liveTracker.isTracking(), 'is tracking');
  });

  QUnit.test('liveui false, trackingThreshold is not met', function(assert) {
    this.player = TestHelpers.makePlayer({liveui: false, liveTracker: {trackingThreshold: 31}});
    this.player.seekable = () => createTimeRanges(0, 30);

    this.player.duration(Infinity);

    assert.notOk(this.player.hasClass('vjs-liveui'), 'does not have vjs-liveui');
    assert.notOk(this.player.liveTracker.isTracking(), 'is not tracking');
  });

  QUnit.module('start/stop', {
    beforeEach() {
      this.clock = sinon.useFakeTimers();

      this.player = TestHelpers.makePlayer({liveui: true});
      this.player.seekable = () => createTimeRanges(0, 30);

      this.liveTracker = this.player.liveTracker;
    },
    afterEach() {
      this.player.dispose();
      this.clock.restore();
    }
  });

  QUnit.test('with durationchange and triggers liveedgechange', function(assert) {
    let liveEdgeChange = 0;

    this.liveTracker.on('liveedgechange', () => {
      liveEdgeChange++;
    });
    assert.notOk(this.liveTracker.isTracking(), 'not started');

    this.player.duration(Infinity);
    assert.ok(this.liveTracker.isTracking(), 'started');
    assert.equal(liveEdgeChange, 1, 'liveedgechange fired');

    this.player.duration(5);
    assert.notOk(this.liveTracker.isTracking(), 'not started');
    assert.equal(liveEdgeChange, 2, 'liveedgechange fired when we stop tracking');

    this.player.duration(Infinity);
    assert.ok(this.liveTracker.isTracking(), 'started');
    assert.equal(liveEdgeChange, 3, 'liveedgechange fired again');
  });

  QUnit.test('with canplay', function(assert) {
    let duration = Infinity;

    this.player.seekable = () => createTimeRanges(0, 30);
    this.player.duration = () => duration;

    assert.notOk(this.liveTracker.isTracking(), 'not started');

    this.player.trigger('canplay');
    assert.ok(this.liveTracker.isTracking(), 'started');

    // end the video by triggering a duration change so we toggle off the liveui
    duration = 5;
    this.player.trigger('durationchange');
    assert.notOk(this.liveTracker.isTracking(), 'not started');

    // pretend we loaded a new source and we got a canplay
    duration = Infinity;
    this.player.trigger('canplay');
    assert.ok(this.liveTracker.isTracking(), 'started');
  });

  QUnit.module('tracking', {
    beforeEach() {
      this.clock = sinon.useFakeTimers();

      this.player = TestHelpers.makePlayer();

      this.liveTracker = this.player.liveTracker;
      this.player.seekable = () => createTimeRanges(0, 30);
      this.player.paused = () => false;
      this.player.duration(Infinity);

      this.liveEdgeChanges = 0;

      this.liveTracker.on('liveedgechange', () => {
        this.liveEdgeChanges++;
      });
    },
    afterEach() {
      this.player.dispose();
      this.clock.restore();
    }
  });

  QUnit.test('Triggers liveedgechange when we fall behind and catch up', function(assert) {
    this.liveTracker.options_.liveTolerance = 6;
    this.player.seekable = () => createTimeRanges(0, 20);
    this.player.trigger('timeupdate');
    this.player.currentTime = () => 14;
    this.clock.tick(6000);
    this.player.seekable = () => createTimeRanges(0, 26);
    this.clock.tick(1000);

    assert.equal(this.liveEdgeChanges, 1, 'should have one live edge change');
    assert.ok(this.liveTracker.behindLiveEdge(), 'behind live edge');

    this.player.currentTime = () => this.liveTracker.liveCurrentTime();
    this.clock.tick(30);

    assert.equal(this.liveEdgeChanges, 2, 'should have two live edge change');
    assert.ok(this.liveTracker.atLiveEdge(), 'at live edge');
  });

  QUnit.test('is behindLiveEdge when paused', function(assert) {
    this.liveTracker.options_.liveTolerance = 6;
    this.player.seekable = () => createTimeRanges(0, 20);
    this.player.trigger('timeupdate');
    this.player.currentTime = () => 20;
    this.clock.tick(1000);

    assert.ok(this.liveTracker.atLiveEdge(), 'at live edge');

    this.player.paused = () => true;
    this.player.trigger('pause');

    assert.equal(this.liveEdgeChanges, 1, 'should have one live edge change');
    assert.ok(this.liveTracker.behindLiveEdge(), 'behindLiveEdge live edge');
  });

  QUnit.test('is behindLiveEdge when seeking behind liveTolerance with API', function(assert) {
    this.liveTracker.options_.liveTolerance = 6;
    this.player.seekable = () => createTimeRanges(0, 20);
    this.player.trigger('timeupdate');
    this.player.currentTime = () => 20;
    this.clock.tick(1000);

    assert.ok(this.liveTracker.atLiveEdge(), 'at live edge');

    this.player.currentTime = () => 14;
    this.player.trigger('seeked');

    assert.equal(this.liveEdgeChanges, 1, 'should have one live edge change');
    assert.ok(this.liveTracker.behindLiveEdge(), 'behindLiveEdge live edge');
  });

  QUnit.test('is behindLiveEdge when seeking >2s behind with ui', function(assert) {
    this.liveTracker.options_.liveTolerance = 6;
    this.player.seekable = () => createTimeRanges(0, 20);
    this.player.trigger('timeupdate');
    this.player.currentTime = () => 20;
    this.clock.tick(1000);

    assert.ok(this.liveTracker.atLiveEdge(), 'at live edge');

    this.liveTracker.nextSeekedFromUser();
    this.player.currentTime = () => 17;
    this.player.trigger('seeked');

    assert.equal(this.liveEdgeChanges, 1, 'should have one live edge change');
    assert.ok(this.liveTracker.behindLiveEdge(), 'behindLiveEdge live edge');
  });

  QUnit.test('pastSeekEnd should update when seekable changes', function(assert) {
    assert.strictEqual(this.liveTracker.liveCurrentTime(), 30, 'liveCurrentTime is now 30');
    this.clock.tick(2010);

    assert.ok(this.liveTracker.pastSeekEnd() > 2, 'pastSeekEnd should be over 2s');

    this.player.seekable = () => createTimeRanges(0, 2);

    this.clock.tick(30);
    assert.strictEqual(this.liveTracker.pastSeekEnd(), 0.03, 'pastSeekEnd start at 0.03 again');
    assert.strictEqual(this.liveTracker.liveCurrentTime(), 2.03, 'liveCurrentTime is now 2.03');
  });

  QUnit.test('can seek to live edge', function(assert) {
    this.player.trigger('timeupdate');

    this.player.seekable = () => createTimeRanges(0, 6);
    this.liveTracker.options_.liveTolerance = 2;
    let currentTime = 0;

    this.player.currentTime = (ct) => {
      if (typeof ct !== 'undefined') {
        currentTime = ct;
      }
      return 0;
    };

    this.clock.tick(6000);

    assert.ok(this.liveTracker.pastSeekEnd() > 2, 'pastSeekEnd should be over 2s');

    this.liveTracker.seekToLiveEdge();

    assert.equal(currentTime, this.liveTracker.liveCurrentTime(), 'should have seeked to liveCurrentTime');
  });

  QUnit.test('does not seek to live edge if at live edge', function(assert) {
    let pauseCalls = 0;
    let playCalls = 0;
    let currentTime = 0;

    this.player.currentTime = (ct) => {
      if (typeof ct !== 'undefined') {
        currentTime = ct;
      }
      return 0;
    };

    this.player.play = () => {
      playCalls++;
    };

    this.player.pause = () => {
      pauseCalls++;
    };

    this.liveTracker.seekToLiveEdge();
    assert.notOk(this.player.hasClass('vjs-waiting'), 'player should not be waiting');
    assert.equal(pauseCalls, 0, 'should not have called pause');

    this.clock.tick(2010);

    assert.ok(this.liveTracker.pastSeekEnd() > 2, 'pastSeekEnd should be over 2s');
    this.player.seekable = () => createTimeRanges(0, 2);

    this.clock.tick(30);
    assert.equal(currentTime, 0, 'should not have seeked to seekableEnd');
    assert.equal(playCalls, 0, 'should not have called play');
  });

  QUnit.test('seeks to live edge on the first timeupdate after playback is requested', function(assert) {
    sinon.spy(this.liveTracker, 'seekToLiveEdge');

    // Begin live tracking.
    this.player.duration(Infinity);
    assert.ok(this.liveTracker.seekToLiveEdge.notCalled, 'seekToLiveEdge was not called yet');

    this.player.trigger('play');
    assert.ok(this.liveTracker.seekToLiveEdge.notCalled, 'seekToLiveEdge was not called yet');

    this.player.trigger('timeupdate');
    assert.ok(this.liveTracker.seekToLiveEdge.calledOnce, 'seekToLiveEdge was called');

    this.player.trigger('timeupdate');
    assert.ok(this.liveTracker.seekToLiveEdge.calledOnce, 'seekToLiveEdge was not called on subsequent timeupdate');
  });

  QUnit.test('does not seek to live edge on the first timeupdate after playback is requested if playback already began', function(assert) {
    sinon.spy(this.liveTracker, 'seekToLiveEdge');

    // Begin live tracking.
    this.liveTracker.stopTracking();
    this.player.hasStarted = () => true;
    this.liveTracker.startTracking();
    assert.ok(this.liveTracker.seekToLiveEdge.notCalled, 'seekToLiveEdge was not called');

    this.player.trigger('play');
    this.player.trigger('playing');
    assert.ok(this.liveTracker.seekToLiveEdge.notCalled, 'seekToLiveEdge was not called');

    this.player.trigger('timeupdate');
    assert.ok(this.liveTracker.seekToLiveEdge.notCalled, 'seekToLiveEdge was not called');

    this.player.trigger('timeupdate');
    assert.ok(this.liveTracker.seekToLiveEdge.notCalled, 'seekToLiveEdge was not called');
  });

  QUnit.test('single seekable, helpers should be correct', function(assert) {
    // simple
    this.player.seekable = () => createTimeRanges(10, 50);
    assert.strictEqual(Math.round(this.liveTracker.liveWindow()), 40, 'liveWindow is ~40s');
    assert.strictEqual(this.liveTracker.seekableStart(), 10, 'seekableStart is 10s');
    assert.strictEqual(this.liveTracker.seekableEnd(), 50, 'seekableEnd is 50s');
  });

  QUnit.test('multiple seekables, helpers should be correct', function(assert) {
    // multiple
    this.player.seekable = () => createTimeRanges([[0, 1], [2, 3], [4, 5]]);
    assert.strictEqual(Math.round(this.liveTracker.liveWindow()), 5, 'liveWindow is ~5s');
    assert.strictEqual(this.liveTracker.seekableStart(), 0, 'seekableStart is 0s');
    assert.strictEqual(this.liveTracker.seekableEnd(), 5, 'seekableEnd is 5s');
  });

  QUnit.test('single seekable with Infinity, helpers should be correct', function(assert) {
    // single with Infinity
    this.player.seekable = () => createTimeRanges(0, Infinity);
    assert.strictEqual(this.liveTracker.liveWindow(), 0, 'liveWindow is Infinity');
    assert.strictEqual(this.liveTracker.seekableStart(), 0, 'seekableStart is 0s');
    assert.strictEqual(this.liveTracker.seekableEnd(), Infinity, 'seekableEnd is Infinity');
  });

  QUnit.test('multiple seekables with Infinity, helpers should be correct', function(assert) {
    // multiple with Infinity
    this.player.seekable = () => createTimeRanges([[0, Infinity], [1, Infinity]]);
    assert.strictEqual(this.liveTracker.liveWindow(), 0, 'liveWindow is Infinity');
    assert.strictEqual(this.liveTracker.seekableStart(), 0, 'seekableStart is 0s');
    assert.strictEqual(this.liveTracker.seekableEnd(), Infinity, 'seekableEnd is Infinity');
  });

  QUnit.test('No seekables, helpers should be defaults', function(assert) {
    // defaults
    this.player.seekable = () => createTimeRanges();

    assert.strictEqual(this.liveTracker.liveWindow(), 0, 'liveWindow is Infinity');
    assert.strictEqual(this.liveTracker.seekableStart(), 0, 'seekableStart is 0s');
    assert.strictEqual(this.liveTracker.seekableEnd(), Infinity, 'seekableEnd is Infinity');
  });

});
