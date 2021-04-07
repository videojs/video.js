/* eslint-env qunit */
import window from 'global/window';
import EventTarget from '../../src/js/event-target.js';
import AsyncEventTarget from '../../src/js/async-event-target.js';
import {isEvented} from '../../src/js/mixins/evented';
import {AsyncTimersMixin} from '../../src/js/mixins/async-timers.js';
import sinon from 'sinon';

// a function that is mostly for unit tests.
export const hasAsyncTimers = function(target) {
  const fns = Object.keys(AsyncTimersMixin);

  for (let i = 0; i < fns.length; i++) {
    if (typeof target[fns[i]] !== 'function') {
      return false;
    }
  }

  return true;
};

QUnit.module('AsyncEventTarget', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
    this.asyncEventTarget = new AsyncEventTarget();
  },
  afterEach() {
    this.asyncEventTarget.dispose();
    this.clock.restore();
  }
});

QUnit.test('should return true for isEvented and hasAsyncTimers', function(assert) {
  assert.ok(isEvented(this.asyncEventTarget), 'isEvented');
  assert.ok(hasAsyncTimers(this.asyncEventTarget), 'hasAsyncTimers');
});

QUnit.test('is disposed once with disposeWith objects', function(assert) {
  const disposeWith = [new EventTarget(), new EventTarget()];
  let disposed = 0;

  this.asyncEventTarget.dispose();
  this.asyncEventTarget = new AsyncEventTarget({disposeWith});

  this.asyncEventTarget.on('dispose', () => {
    disposed++;
  });

  disposeWith[0].trigger('dispose');

  assert.equal(disposed, 1, 'asyncEventTarget was disposed');

  disposeWith[1].trigger('dispose');
  assert.equal(disposed, 1, 'asyncEventTarget was not disposed again');
});

QUnit.test('setTimeout method that is automatically cleared on disposal', function(assert) {
  const comp = this.asyncEventTarget;
  let timeoutsFired = 0;
  const timeoutToClear = comp.setTimeout(function() {
    timeoutsFired++;
    assert.ok(false, 'Timeout should have been manually cleared');
  }, 500);

  assert.expect(4);

  comp.setTimeout(function() {
    timeoutsFired++;
    assert.equal(this, comp, 'Timeout fn has the component as its context');
    assert.ok(true, 'Timeout created and fired.');
  }, 100);

  comp.setTimeout(function() {
    timeoutsFired++;
    assert.ok(false, 'Timeout should have been disposed');
  }, 1000);

  this.clock.tick(100);

  assert.ok(timeoutsFired === 1, 'One timeout should have fired by this point');

  comp.clearTimeout(timeoutToClear);

  this.clock.tick(500);

  comp.dispose();

  this.clock.tick(1000);

  assert.ok(timeoutsFired === 1, 'One timeout should have fired overall');
});

QUnit.test('setInterval should function as expected and be cleared on disposal', function(assert) {
  const comp = this.asyncEventTarget;

  let intervalsFired = 0;

  const interval = comp.setInterval(function() {
    intervalsFired++;
    assert.equal(this, comp, 'Interval fn has the component as its context');
    assert.ok(true, 'Interval created and fired.');
  }, 100);

  assert.expect(13);

  comp.setInterval(function() {
    intervalsFired++;
    assert.ok(false, 'Interval should have been disposed');
  }, 1200);

  this.clock.tick(500);

  assert.ok(intervalsFired === 5, 'Component interval fired 5 times');

  comp.clearInterval(interval);

  this.clock.tick(600);

  assert.ok(intervalsFired === 5, 'Interval was manually cleared');

  comp.dispose();

  this.clock.tick(1200);

  assert.ok(intervalsFired === 5, 'Interval was cleared when component was disposed');
});

QUnit.test('requestAnimationFrame works as expected and is cleared on disposal', function(assert) {
  const comp = this.asyncEventTarget;
  const oldRAF = window.requestAnimationFrame;
  const oldCAF = window.cancelAnimationFrame;

  // Stub the window.*AnimationFrame methods with window.setTimeout methods
  // so we can control when the callbacks are called via sinon's timer stubs.
  window.requestAnimationFrame = (fn) => window.setTimeout(fn, 1);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);

  // Make sure the component thinks it supports rAF.
  comp.supportsRaf_ = true;

  const spyRAF = sinon.spy();

  comp.requestNamedAnimationFrame('testing', spyRAF);

  assert.strictEqual(spyRAF.callCount, 0, 'rAF callback was not called immediately');
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'rAF callback was called after a "repaint"');
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'rAF callback was not called after a second "repaint"');

  comp.cancelNamedAnimationFrame(comp.requestNamedAnimationFrame('testing', spyRAF));
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'second rAF callback was not called because it was cancelled');

  comp.requestNamedAnimationFrame('testing', spyRAF);
  comp.dispose();
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'third rAF callback was not called because the component was disposed');

  window.requestAnimationFrame = oldRAF;
  window.cancelAnimationFrame = oldCAF;
});

QUnit.test('requestNamedAnimationFrame works as expected and cleared on disposal', function(assert) {
  const comp = this.asyncEventTarget;
  const oldRAF = window.requestAnimationFrame;
  const oldCAF = window.cancelAnimationFrame;

  // Stub the window.*AnimationFrame methods with window.setTimeout methods
  // so we can control when the callbacks are called via sinon's timer stubs.
  window.requestAnimationFrame = (fn) => window.setTimeout(fn, 1);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);

  // Make sure the component thinks it supports rAF.
  comp.supportsRaf_ = true;

  const spyRAF = sinon.spy();

  comp.requestNamedAnimationFrame('testing', spyRAF);

  assert.strictEqual(spyRAF.callCount, 0, 'rAF callback was not called immediately');
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'rAF callback was called after a "repaint"');
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'rAF callback was not called after a second "repaint"');

  comp.cancelNamedAnimationFrame(comp.requestNamedAnimationFrame('testing', spyRAF));
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'second rAF callback was not called because it was cancelled');

  comp.requestNamedAnimationFrame('testing', spyRAF);
  comp.dispose();
  this.clock.tick(1);
  assert.strictEqual(spyRAF.callCount, 1, 'third rAF callback was not called because the component was disposed');

  window.requestAnimationFrame = oldRAF;
  window.cancelAnimationFrame = oldCAF;
});

QUnit.test('requestAnimationFrame falls back to timers if rAF not supported', function(assert) {
  const comp = this.asyncEventTarget;
  const oldRAF = window.requestAnimationFrame;
  const oldCAF = window.cancelAnimationFrame;

  // Stub the window.*AnimationFrame methods with window.setTimeout methods
  // so we can control when the callbacks are called via sinon's timer stubs.
  const rAF = window.requestAnimationFrame = sinon.spy();
  const cAF = window.cancelAnimationFrame = sinon.spy();

  // Make sure the component thinks it does not support rAF.
  comp.supportsRaf_ = false;

  sinon.spy(comp, 'setTimeout');
  sinon.spy(comp, 'clearTimeout');

  comp.cancelAnimationFrame(comp.requestAnimationFrame(() => {}));

  assert.strictEqual(rAF.callCount, 0, 'window.requestAnimationFrame was not called');
  assert.strictEqual(cAF.callCount, 0, 'window.cancelAnimationFrame was not called');
  assert.strictEqual(comp.setTimeout.callCount, 1, 'Component#setTimeout was called');
  assert.strictEqual(comp.clearTimeout.callCount, 1, 'Component#clearTimeout was called');

  comp.dispose();
  window.requestAnimationFrame = oldRAF;
  window.cancelAnimationFrame = oldCAF;
});

QUnit.test('setTimeout should remove dispose handler on trigger', function(assert) {
  const comp = this.asyncEventTarget;

  comp.setTimeout(() => {}, 1);

  assert.equal(comp.setTimeoutIds_.size, 1, 'we removed our dispose handle');

  this.clock.tick(1);

  assert.equal(comp.setTimeoutIds_.size, 0, 'we removed our dispose handle');

  comp.dispose();
});

QUnit.test('requestNamedAnimationFrame should remove dispose handler on trigger', function(assert) {
  const comp = this.asyncEventTarget;
  const oldRAF = window.requestAnimationFrame;
  const oldCAF = window.cancelAnimationFrame;

  // Stub the window.*AnimationFrame methods with window.setTimeout methods
  // so we can control when the callbacks are called via sinon's timer stubs.
  window.requestAnimationFrame = (fn) => window.setTimeout(fn, 1);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);

  // Make sure the component thinks it supports rAF.
  comp.supportsRaf_ = true;

  const spyRAF = sinon.spy();

  comp.requestNamedAnimationFrame('testFrame', spyRAF);

  assert.equal(comp.rafIds_.size, 1, 'we got a new raf dispose handler');
  assert.equal(comp.namedRafs_.size, 1, 'we got a new named raf dispose handler');

  this.clock.tick(1);

  assert.equal(comp.rafIds_.size, 0, 'we removed our raf dispose handle');
  assert.equal(comp.namedRafs_.size, 0, 'we removed our named raf dispose handle');

  comp.dispose();

  window.requestAnimationFrame = oldRAF;
  window.cancelAnimationFrame = oldCAF;
});

QUnit.test('requestAnimationFrame should remove dispose handler on trigger', function(assert) {
  const comp = this.asyncEventTarget;
  const oldRAF = window.requestAnimationFrame;
  const oldCAF = window.cancelAnimationFrame;

  // Stub the window.*AnimationFrame methods with window.setTimeout methods
  // so we can control when the callbacks are called via sinon's timer stubs.
  window.requestAnimationFrame = (fn) => window.setTimeout(fn, 1);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);

  // Make sure the component thinks it supports rAF.
  comp.supportsRaf_ = true;

  const spyRAF = sinon.spy();

  comp.requestAnimationFrame(spyRAF);

  assert.equal(comp.rafIds_.size, 1, 'we got a new dispose handler');

  this.clock.tick(1);

  assert.equal(comp.rafIds_.size, 0, 'we removed our dispose handle');

  comp.dispose();

  window.requestAnimationFrame = oldRAF;
  window.cancelAnimationFrame = oldCAF;
});

QUnit.test('setTimeout should be canceled on dispose', function(assert) {
  const comp = this.asyncEventTarget;
  let called = false;
  let clearId;
  const setId = comp.setTimeout(() => {
    called = true;
  }, 1);

  const clearTimeout = comp.clearTimeout;

  comp.clearTimeout = (id) => {
    clearId = id;
    return clearTimeout.call(comp, id);
  };

  assert.equal(comp.setTimeoutIds_.size, 1, 'we added a timeout id');

  comp.dispose();

  assert.equal(comp.setTimeoutIds_.size, 0, 'we removed our timeout id');
  assert.equal(clearId, setId, 'clearTimeout was called');

  this.clock.tick(1);

  assert.equal(called, false, 'setTimeout was never called');
});

QUnit.test('requestAnimationFrame should be canceled on dispose', function(assert) {
  const comp = this.asyncEventTarget;
  let called = false;
  let clearId;
  const setId = comp.requestAnimationFrame(() => {
    called = true;
  });

  const cancelAnimationFrame = comp.cancelAnimationFrame;

  comp.cancelAnimationFrame = (id) => {
    clearId = id;
    return cancelAnimationFrame.call(comp, id);
  };

  assert.equal(comp.rafIds_.size, 1, 'we added a raf id');

  comp.dispose();

  assert.equal(comp.rafIds_.size, 0, 'we removed a raf id');
  assert.equal(clearId, setId, 'clearAnimationFrame was called');

  this.clock.tick(1);

  assert.equal(called, false, 'requestAnimationFrame was never called');
});

QUnit.test('setInterval should be canceled on dispose', function(assert) {
  const comp = this.asyncEventTarget;
  let called = false;
  let clearId;
  const setId = comp.setInterval(() => {
    called = true;
  });

  const clearInterval = comp.clearInterval;

  comp.clearInterval = (id) => {
    clearId = id;
    return clearInterval.call(comp, id);
  };

  assert.equal(comp.setIntervalIds_.size, 1, 'we added an interval id');

  comp.dispose();

  assert.equal(comp.setIntervalIds_.size, 0, 'we removed a raf id');
  assert.equal(clearId, setId, 'clearInterval was called');

  this.clock.tick(1);

  assert.equal(called, false, 'setInterval was never called');
});

QUnit.test('requestNamedAnimationFrame should be canceled on dispose', function(assert) {
  const comp = this.asyncEventTarget;
  let called = false;
  let clearName;
  const setName = comp.requestNamedAnimationFrame('testing', () => {
    called = true;
  });

  const cancelNamedAnimationFrame = comp.cancelNamedAnimationFrame;

  comp.cancelNamedAnimationFrame = (name) => {
    clearName = name;
    return cancelNamedAnimationFrame.call(comp, name);
  };

  assert.equal(comp.namedRafs_.size, 1, 'we added a named raf');
  assert.equal(comp.rafIds_.size, 1, 'we added a raf id');

  comp.dispose();

  assert.equal(comp.namedRafs_.size, 0, 'we removed a named raf');
  assert.equal(comp.rafIds_.size, 0, 'we removed a raf id');
  assert.equal(clearName, setName, 'cancelNamedAnimationFrame was called');

  this.clock.tick(1);

  assert.equal(called, false, 'requestNamedAnimationFrame was never called');
});

QUnit.test('requestNamedAnimationFrame should only allow one raf of a specific name at a time', function(assert) {
  const comp = this.asyncEventTarget;
  const calls = {
    one: 0,
    two: 0,
    three: 0
  };
  const cancelNames = [];
  const name = 'testing';
  const handlerOne = () => {
    assert.equal(comp.namedRafs_.size, 1, 'named raf still exists while function runs');
    assert.equal(comp.rafIds_.size, 0, 'raf id does not exist during run');

    calls.one++;
  };
  const handlerTwo = () => {
    assert.equal(comp.namedRafs_.size, 1, 'named raf still exists while function runs');
    assert.equal(comp.rafIds_.size, 0, 'raf id does not exist during run');
    calls.two++;
  };
  const handlerThree = () => {
    assert.equal(comp.namedRafs_.size, 1, 'named raf still exists while function runs');
    assert.equal(comp.rafIds_.size, 0, 'raf id does not exist during run');
    calls.three++;
  };

  const oldRAF = window.requestAnimationFrame;
  const oldCAF = window.cancelAnimationFrame;

  // Make sure the component thinks it supports rAF.
  comp.supportsRaf_ = true;

  // Stub the window.*AnimationFrame methods with window.setTimeout methods
  // so we can control when the callbacks are called via sinon's timer stubs.
  window.requestAnimationFrame = (fn) => window.setTimeout(fn, 1);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);

  const cancelNamedAnimationFrame = comp.cancelNamedAnimationFrame;

  comp.cancelNamedAnimationFrame = (_name) => {
    cancelNames.push(_name);
    return cancelNamedAnimationFrame.call(comp, _name);
  };

  comp.requestNamedAnimationFrame(name, handlerOne);

  assert.equal(comp.namedRafs_.size, 1, 'we added a named raf');
  assert.equal(comp.rafIds_.size, 1, 'we added a raf id');

  comp.requestNamedAnimationFrame(name, handlerTwo);

  assert.deepEqual(cancelNames, [], 'no named cancels');
  assert.equal(comp.namedRafs_.size, 1, 'still only one named raf');
  assert.equal(comp.rafIds_.size, 1, 'still only one raf id');

  this.clock.tick(1);

  assert.equal(comp.namedRafs_.size, 0, 'we removed a named raf');
  assert.equal(comp.rafIds_.size, 0, 'we removed a raf id');
  assert.deepEqual(calls, {
    one: 1,
    two: 0,
    three: 0
  }, 'only handlerOne was called');

  comp.requestNamedAnimationFrame(name, handlerOne);
  comp.requestNamedAnimationFrame(name, handlerTwo);
  comp.requestNamedAnimationFrame(name, handlerThree);

  assert.deepEqual(cancelNames, [], 'no named cancels for testing');
  assert.equal(comp.namedRafs_.size, 1, 'only added one named raf');
  assert.equal(comp.rafIds_.size, 1, 'only added one named raf');

  this.clock.tick(1);

  assert.equal(comp.namedRafs_.size, 0, 'we removed a named raf');
  assert.equal(comp.rafIds_.size, 0, 'we removed a raf id');
  assert.deepEqual(calls, {
    one: 2,
    two: 0,
    three: 0
  }, 'only the handlerOne called');

  window.requestAnimationFrame = oldRAF;
  window.cancelAnimationFrame = oldCAF;
});

