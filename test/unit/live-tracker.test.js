/* eslint-env qunit */
import TestHelpers from './test-helpers.js';
import {createTimeRanges} from '../../src/js/utils/time-ranges.js';
import sinon from 'sinon';

QUnit.module('LiveTracker', () => {

  QUnit.module('start/stop', {
    beforeEach() {
      this.clock = sinon.useFakeTimers();

      this.player = TestHelpers.makePlayer({liveui: true});

      this.liveTracker = this.player.liveTracker;
    },
    afterEach() {
      this.player.dispose();
      this.clock.restore();
    }
  });

  QUnit.test('starts/stop with durationchange and triggers liveedgechange', function(assert) {
    let liveEdgeChange = 0;

    this.liveTracker.on('liveedgechange', () => {
      liveEdgeChange++;
    });
    assert.notOk(this.liveTracker.started(), 'not started');

    this.player.duration(Infinity);
    assert.ok(this.liveTracker.started(), 'started');
    assert.equal(liveEdgeChange, 1, 'liveedgechange fired');

    this.player.duration(5);
    assert.notOk(this.liveTracker.started(), 'not started');

    this.player.duration(Infinity);
    assert.ok(this.liveTracker.started(), 'started');
    assert.equal(liveEdgeChange, 2, 'liveedgechange fired again');
  });

  QUnit.module('tracking', {
    beforeEach() {
      this.clock = sinon.useFakeTimers();

      this.player = TestHelpers.makePlayer();

      this.liveTracker = this.player.liveTracker;
      this.player.duration(Infinity);

      this.liveEdgeChanges = 0;
      this.seekableEndChanges = 0;

      this.liveTracker.on('seekableendchange', () => {
        this.seekableEndChanges++;
      });

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
    this.player.currentTime = () => 0;
    this.clock.tick(20000);

    assert.equal(this.liveEdgeChanges, 1, 'should have one live edge change');
    assert.ok(this.liveTracker.behindLiveEdge(), 'behind live edge');

    this.player.currentTime = () => 20;
    this.clock.tick(30);

    assert.equal(this.liveEdgeChanges, 2, 'should have two live edge change');
    assert.ok(this.liveTracker.atLiveEdge(), 'at live edge');
  });

  QUnit.test('pastSeekEnd should update when seekable changes', function(assert) {
    assert.strictEqual(this.liveTracker.liveCurrentTime(), 0.03, 'liveCurrentTime is now 0.03');
    this.clock.tick(2000);

    assert.ok(this.liveTracker.pastSeekEnd() > 2, 'pastSeekEnd should be over 2s');

    this.player.seekable = () => createTimeRanges(0, 2);

    this.clock.tick(30);
    assert.strictEqual(this.liveTracker.pastSeekEnd(), 0.03, 'pastSeekEnd start at 0.03 again');
    assert.strictEqual(this.liveTracker.liveCurrentTime(), 2.03, 'liveCurrentTime is now 2.03');
    assert.equal(this.seekableEndChanges, 1, 'should be one seek end change');
  });

  QUnit.test('seeks to live edge on seekableendchange', function(assert) {
    this.liveTracker.segmentLength_ = 2;
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
    this.clock.tick(3000);

    assert.ok(this.liveTracker.pastSeekEnd() > 2, 'pastSeekEnd should be over 2s');

    this.liveTracker.seekToLiveEdge();

    assert.ok(this.player.hasClass('vjs-waiting'), 'player should be waiting');
    assert.equal(pauseCalls, 1, 'should be paused');
    this.player.seekable = () => createTimeRanges(0, 2);

    this.clock.tick(30);
    assert.equal(this.seekableEndChanges, 1, 'should be one seek end change');
    assert.equal(currentTime, 2, 'should have seeked to seekableEnd');
    assert.equal(playCalls, 1, 'should be playing');
    assert.notOk(this.player.hasClass('vjs-waiting'), 'player should not be waiting');
  });

  QUnit.test('does not seek to to live edge if at live edge', function(assert) {
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

    this.clock.tick(2000);

    assert.ok(this.liveTracker.pastSeekEnd() > 2, 'pastSeekEnd should be over 2s');
    this.player.seekable = () => createTimeRanges(0, 2);

    this.clock.tick(30);
    assert.equal(this.seekableEndChanges, 1, 'should be one seek end change');
    assert.equal(currentTime, 0, 'should not have seeked to seekableEnd');
    assert.equal(playCalls, 0, 'should not have called play');
  });

  QUnit.test('Helper functions should be correct', function(assert) {
    this.player.seekable = () => createTimeRanges(10, 50);

    assert.strictEqual(this.liveTracker.liveWindow(), 40, 'liveWindow is 40s');
    assert.strictEqual(this.liveTracker.seekableStart(), 10, 'seekableStart is 10s');
    assert.strictEqual(this.liveTracker.seekableEnd(), 50, 'seekableEnd is 50s');
  });

});
