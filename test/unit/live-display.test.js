/* eslint-env qunit */
import TestHelpers from './test-helpers.js';
import sinon from 'sinon';

QUnit.module('LiveDisplay', () => {
  QUnit.module('live', {
    beforeEach() {
      this.clock = sinon.useFakeTimers();

      this.player = TestHelpers.makePlayer();
      this.liveDisplay = this.player.controlBar.liveDisplay;

      // mock live state
      this.player.duration(Infinity);
    },
    afterEach() {
      this.player.dispose();
      this.clock.restore();
    }
  });

  QUnit.test('shows until hidden when live', function(assert) {
    assert.notOk(this.liveDisplay.hasClass('vjs-hidden'), 'is not hidden');

    this.liveDisplay.hide();

    assert.ok(this.liveDisplay.hasClass('vjs-hidden'), 'is hidden');
  });

  QUnit.test('at live edge if liveTracker says we are', function(assert) {
    this.player.liveTracker.behindLiveEdge = () => false;
    this.player.liveTracker.trigger('live-edge-change');

    assert.ok(this.liveDisplay.hasClass('vjs-at-live-edge'), 'has at live edge class');
  });

  QUnit.test('behind live edge if liveTracker says we are', function(assert) {
    this.player.liveTracker.behindLiveEdge = () => true;
    this.player.liveTracker.trigger('live-edge-change');

    assert.notOk(this.liveDisplay.hasClass('vjs-at-live-edge'), 'does not have live edge class');
  });

  QUnit.test('switch to non live', function(assert) {
    this.player.duration(4);
    this.player.trigger('durationchange');
    assert.ok(this.liveDisplay.hasClass('vjs-hidden'), 'is hidden');
  });

  QUnit.module('not live', {
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
  });

  QUnit.test('switch to live', function(assert) {
    assert.ok(this.liveDisplay.hasClass('vjs-hidden'), 'is hidden');

    this.player.duration(Infinity);
    this.player.trigger('durationchange');

    assert.notOk(this.liveDisplay.hasClass('vjs-hidden'), 'is no longer hidden');
  });
});
