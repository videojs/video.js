/* eslint-env qunit */
import TestHelpers from './test-helpers.js';
import sinon from 'sinon';
import computedStyle from '../../src/js/utils/computed-style.js';
import { createTimeRange } from '../../src/js/utils/time-ranges.js';

QUnit.module('SeekToLive', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
    this.player = TestHelpers.makePlayer();
    this.seekToLive = this.player.controlBar.seekToLive;
    this.getComputedDisplay = () => {
      return computedStyle(this.seekToLive.el(), 'display');
    };

    this.mockLiveui = () => {
      this.player.paused = () => false;
      this.player.hasStarted = () => true;
      this.player.options_.liveui = true;
      this.player.seekable = () => createTimeRange(0, 45);
      this.player.currentTime = () => this.player.liveTracker.liveCurrentTime();
      this.player.duration(Infinity);
    };
  },
  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('liveui enabled, can switch between at and behind live edge ', function(assert) {
  this.mockLiveui();

  assert.notEqual(this.getComputedDisplay(), 'none', 'is not hidden');
  assert.ok(this.seekToLive.hasClass('vjs-at-live-edge'), 'has at live edge class');

  this.player.currentTime = () => 0;
  this.player.seekable = () => createTimeRange(0, 38);
  this.clock.tick(30);

  assert.notOk(this.seekToLive.hasClass('vjs-at-live-edge'), 'does not have at live edge class');
});

QUnit.test('liveui enabled can show/hide on durationchange', function(assert) {
  // start out non-live
  assert.equal(this.getComputedDisplay(), 'none', 'is hidden');
  assert.notOk(this.seekToLive.hasClass('vjs-at-live-edge'), 'does not have at live edge class');

  // switch to live
  this.mockLiveui();

  assert.notEqual(this.getComputedDisplay(), 'none', 'is not hidden');
  assert.ok(this.seekToLive.hasClass('vjs-at-live-edge'), 'has at live edge class');

  // switch to non-live
  this.player.duration(20);

  assert.equal(this.getComputedDisplay(), 'none', 'is hidden');
  assert.notOk(this.seekToLive.hasClass('vjs-at-live-edge'), 'does not have at live edge class');

  // back to live again.
  this.mockLiveui();

  assert.notEqual(this.getComputedDisplay(), 'none', 'is not hidden');
  assert.ok(this.seekToLive.hasClass('vjs-at-live-edge'), 'has at live edge class');
});

QUnit.test('liveui disabled live window is never shown', function(assert) {
  assert.equal(this.getComputedDisplay(), 'none', 'is hidden');
  assert.notOk(this.seekToLive.hasClass('vjs-at-live-edge'), 'does not have at live edge class');

  this.player.paused = () => false;
  this.player.hasStarted = () => true;
  this.player.currentTime = () => this.player.liveTracker.liveCurrentTime();

  // liveui false, seekable range is good though
  this.player.options_.liveui = false;
  this.player.duration(Infinity);

  assert.equal(this.getComputedDisplay(), 'none', 'is hidden');
  assert.notOk(this.seekToLive.hasClass('vjs-at-live-edge'), 'does not have at live edge class');

  this.player.duration(10);

  // liveui false
  this.player.options_.liveui = false;
  this.player.seekable = () => createTimeRange(0, 19);
  this.player.duration(Infinity);

  assert.equal(this.getComputedDisplay(), 'none', 'is hidden');
  assert.notOk(this.seekToLive.hasClass('vjs-at-live-edge'), 'does not have at live edge class');
});
