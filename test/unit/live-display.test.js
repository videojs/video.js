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
  assert.strictEqual(this.liveDisplay.liveCurrentTime(), 1, 'live current time is incremented');
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
