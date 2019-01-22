/* eslint-env qunit */
import ResizeManager from '../../src/js/resize-manager.js';
import TestHelpers from './test-helpers.js';
import sinon from 'sinon';

QUnit.module('ResizeManager', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
    this.player = TestHelpers.makePlayer();
  },
  afterEach() {
    this.player.dispose();
    this.clock.restore();
  }
});

QUnit.test('ResizeManager creates an iframe if ResizeObserver is not available', function(assert) {
  const rm = new ResizeManager(this.player, {ResizeObserver: null});

  assert.equal(rm.el().tagName.toLowerCase(), 'iframe', 'we got an iframe');
  assert.equal(rm.el().getAttribute('tabIndex'), '-1', 'TabIndex is set to -1');
  assert.equal(rm.el().getAttribute('aria-hidden'), 'true', 'aria-hidden property is set');

  rm.dispose();
});

QUnit.test('ResizeManager uses the ResizeObserver, if given', function(assert) {
  let roCreated = false;
  let observeCalled = false;
  let unobserveCalled = false;
  let disconnectCalled = false;
  let sameEl = false;

  class MyResizeObserver {
    constructor(fn) {
      roCreated = true;
    }

    observe(el) {
      observeCalled = true;
      this.el = el;
    }

    unobserve(el) {
      unobserveCalled = true;
      sameEl = this.el === el;
    }

    disconnect() {
      disconnectCalled = true;
    }
  }

  const rm = new ResizeManager(this.player, {ResizeObserver: MyResizeObserver});

  assert.ok(roCreated, 'we intantiated the RO that was passed');
  assert.ok(observeCalled, 'we observed the RO');
  assert.equal(rm.resizeObserver_.el, this.player.el(), 'we observed the player el');

  rm.dispose();

  assert.ok(unobserveCalled, 'we unobserve when disposed');
  assert.ok(sameEl, 'we unobserve the same el as we observed');
  assert.ok(disconnectCalled, 'we disconnected when disposed');
});

QUnit.test('ResizeManager triggers `playerresize` when the observer method is called', function(assert) {
  let observer;

  class MyResizeObserver {
    constructor(fn) {
      observer = fn;
    }

    observe(el) {
      this.el = el;
    }

    unobserve(el) {
    }

    disconnect() {
    }
  }

  let playerresizeCalled = 0;
  const rm = new ResizeManager(this.player, {ResizeObserver: MyResizeObserver});

  this.player.one('playerresize', function() {
    playerresizeCalled++;
  });
  observer();

  this.clock.tick(100);

  assert.equal(playerresizeCalled, 1, 'playerresize was triggered');

  rm.dispose();
});
