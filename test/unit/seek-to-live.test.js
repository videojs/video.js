/* eslint-env qunit */
import TestHelpers from './test-helpers.js';
import sinon from 'sinon';
import computedStyle from '../../src/js/utils/computed-style.js';

QUnit.module('SeekToLive', () => {
  QUnit.module('live with liveui', {
    beforeEach() {
      this.clock = sinon.useFakeTimers();

      this.player = TestHelpers.makePlayer({liveui: true});
      this.seekToLive = this.player.controlBar.seekToLive;

      this.getComputedDisplay = () => {
        return computedStyle(this.seekToLive.el(), 'display');
      };

      // mock live state
      this.player.duration(Infinity);
    },
    afterEach() {
      this.player.dispose();
      this.clock.restore();
    }
  });

  QUnit.test('at live edge if liveTracker says we are', function(assert) {
    this.player.liveTracker.behindLiveEdge = () => false;
    this.player.liveTracker.trigger('liveedgechange');

    assert.ok(this.seekToLive.hasClass('vjs-at-live-edge'), 'has at live edge class');
  });

  QUnit.test('behind live edge if liveTracker says we are', function(assert) {
    this.player.liveTracker.behindLiveEdge = () => true;
    this.player.liveTracker.trigger('liveedgechange');

    assert.notOk(this.seekToLive.hasClass('vjs-at-live-edge'), 'does not have live edge class');
  });

  QUnit.test('switch to non live', function(assert) {
    this.player.duration(4);
    this.player.trigger('durationchange');
    assert.equal(this.getComputedDisplay(), 'none', 'is hidden');
  });

  QUnit.module('live without liveui', {
    beforeEach() {
      this.clock = sinon.useFakeTimers();

      this.player = TestHelpers.makePlayer();
      this.seekToLive = this.player.controlBar.seekToLive;

      this.getComputedDisplay = () => {
        return computedStyle(this.seekToLive.el(), 'display');
      };

      // mock live state
      this.player.duration(Infinity);
    },
    afterEach() {
      this.player.dispose();
      this.clock.restore();
    }
  });

  QUnit.test('should be hidden', function(assert) {
    assert.equal(this.getComputedDisplay(), 'none', 'is hidden');
  });

  QUnit.module('not live', {
    beforeEach() {
      this.player = TestHelpers.makePlayer({liveui: true});
      this.seekToLive = this.player.controlBar.seekToLive;

      this.getComputedDisplay = () => {
        return computedStyle(this.seekToLive.el(), 'display');
      };
    },
    afterEach() {
      this.player.dispose();
    }
  });

  QUnit.test('should not show or track', function(assert) {
    assert.equal(this.getComputedDisplay(), 'none', 'is hidden');
  });

  QUnit.test('switch to live', function(assert) {
    assert.equal(this.getComputedDisplay(), 'none', 'is hidden');

    this.player.duration(Infinity);
    this.player.trigger('durationchange');

    assert.notEqual(this.getComputedDisplay(), 'none', 'is not hidden');
  });
});
