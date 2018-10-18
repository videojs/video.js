/* eslint-env qunit */
import TestHelpers from './test-helpers.js';
import {createTimeRanges} from '../../src/js/utils/time-ranges.js';
import sinon from 'sinon';

QUnit.module('LiveDisplay - live', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();

    this.player = TestHelpers.makePlayer();
    this.liveDisplay = this.player.controlBar.liveDisplay;

    // mock live state
    this.player.tech_.duration = () => Infinity;
    this.player.tech_.trigger('durationchange');
  },
  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('show and track, until hidden', function(assert) {
  assert.ok(!this.liveDisplay.hasClass('vjs-hidden'), 'is not hidden');
  assert.ok(this.liveDisplay.trackingInterval_, 'is tracking');

  this.liveDisplay.hide();

  assert.ok(this.liveDisplay.hasClass('vjs-hidden'), 'is hidden');
  assert.ok(!this.liveDisplay.trackingInterval_, 'is not tracking');
});

QUnit.test('show and track, until dispose', function(assert) {
  assert.ok(!this.liveDisplay.hasClass('vjs-hidden'), 'is not hidden');
  assert.ok(this.liveDisplay.trackingInterval_, 'is tracking');

  this.liveDisplay.dispose();

  assert.ok(!this.liveDisplay.trackingInterval_, 'is not tracking');
});

QUnit.test('at live edge if currentTime is within 500ms of liveCurrentTime', function(assert) {
  this.player.currentTime = () => this.liveDisplay.liveCurrentTime();

  this.clock.tick(1000);

  assert.ok(this.liveDisplay.hasClass('vjs-at-live-edge'), 'has at live edge class');
  assert.ok(this.liveDisplay.liveCurrentTime() > 0, 'live current time is incremented');
});

QUnit.test('at live edge if seekEnd is Infinity', function(assert) {
  this.player.tech_.seekable = () => createTimeRanges(0, Infinity);

  this.clock.tick(250);

  assert.ok(this.liveDisplay.hasClass('vjs-at-live-edge'), 'has at live edge class');
  assert.strictEqual(this.liveDisplay.liveCurrentTime(), Infinity, 'live current time is infinity');
});

QUnit.test('not at live edge if currentTime is not within 500ms of liveCurrentTime', function(assert) {
  this.player.tech_.seekable = () => createTimeRanges(0, 10);

  this.clock.tick(250);

  assert.ok(!this.liveDisplay.hasClass('vjs-at-live-edge'), 'does not have live edge class');
});

QUnit.test('at live edge if seekable has no length', function(assert) {
  this.player.tech_.seekable = () => [];

  this.clock.tick(250);

  assert.ok(this.liveDisplay.hasClass('vjs-at-live-edge'), 'has live edge class');
});

QUnit.test('should stay at live edge after a long time', function(assert) {
  const segmentLength = 6;
  let currentTime = segmentLength;
  let seekable = createTimeRanges(0, segmentLength);

  this.player.tech_.seekable = () => seekable;
  this.player.currentTime = () => currentTime;

  const currentTimeInterval = this.player.setInterval(function() {
    const liveEdge = seekable.end(0) + segmentLength;

    seekable = createTimeRanges(seekable.start(0), liveEdge);
    currentTime = liveEdge;
  }, 6000);

  const seekableInterval = this.player.setInterval(function() {
    currentTime += 0.03;
  }, 30);

  let removeLiveEdge = 0;

  this.liveDisplay.removeClass = (className) => {
    if (className === 'vjs-at-live-edge') {
      removeLiveEdge++;
    }
  };

  // 2 hours in ms
  this.clock.tick(1000 * 60 * 60 * 2);

  assert.strictEqual(removeLiveEdge, 0, 'no calls to remove live edge class');

  this.player.clearInterval(currentTimeInterval);
  this.player.clearInterval(seekableInterval);
});

QUnit.test('switch to non live', function(assert) {
  this.player.duration = () => 4;
  this.player.trigger('durationchange');
  assert.ok(this.liveDisplay.hasClass('vjs-hidden'), 'is hidden');
  assert.ok(!this.liveDisplay.trackingInterval_, 'is not tracking');
});

QUnit.module('LiveDisplay - not live', {
  beforeEach() {
    this.player = TestHelpers.makePlayer();
    this.liveDisplay = this.player.controlBar.liveDisplay;
  },
  afterEach() {
    this.player.dispose();
  }
});

QUnit.test('should not show or track', function(assert) {
  assert.ok(this.liveDisplay.hasClass('vjs-hidden'), 'is hidden');
  assert.ok(!this.liveDisplay.trackingInterval_, 'is not tracking');
});

QUnit.test('switch to live', function(assert) {
  this.player.duration = () => Infinity;
  this.player.trigger('durationchange');
  assert.ok(!this.liveDisplay.hasClass('vjs-hidden'), 'is not hidden');
  assert.ok(this.liveDisplay.trackingInterval_, 'is tracking');
});
