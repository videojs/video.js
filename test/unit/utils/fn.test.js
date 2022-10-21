/* eslint-env qunit */
import sinon from 'sinon';
import * as Fn from '../../../src/js/utils/fn';

QUnit.module('utils/fn', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
  },
  afterEach() {
    this.clock.restore();
  }
});

QUnit.test('should add context to a function', function(assert) {
  assert.expect(1);

  const newContext = { test: 'obj'};
  const asdf = function() {
    assert.ok(this === newContext);
  };
  const fdsa = Fn.bind_(newContext, asdf);

  fdsa();
});

QUnit.test('should throttle functions properly', function(assert) {
  assert.expect(3);

  const tester = sinon.spy();
  const throttled = Fn.throttle(tester, 100);

  // We must wait a full wait period before the function can be called.
  this.clock.tick(100);
  throttled();
  throttled();
  this.clock.tick(50);
  throttled();

  assert.strictEqual(tester.callCount, 1, 'the throttled function has been called the correct number of times');

  this.clock.tick(50);
  throttled();

  assert.strictEqual(tester.callCount, 2, 'the throttled function has been called the correct number of times');

  throttled();
  this.clock.tick(100);
  throttled();

  assert.strictEqual(tester.callCount, 3, 'the throttled function has been called the correct number of times');
});

QUnit.test('should debounce functions properly', function(assert) {
  assert.expect(6);

  const tester = sinon.spy();
  const debounced = Fn.debounce(tester, 100);

  // Called twice on each assertion to ensure that multiple calls only result
  // in a call to the inner function.
  debounced();
  debounced();
  assert.strictEqual(tester.callCount, 0, 'the debounced function was NOT called because no time has elapsed');

  this.clock.tick(100);
  assert.strictEqual(tester.callCount, 1, 'the debounced function was called because enough time elapsed');

  this.clock.tick(100);
  assert.strictEqual(tester.callCount, 1, 'the debounced function was NOT called again even though time elapsed');

  debounced();
  debounced();
  assert.strictEqual(tester.callCount, 1, 'the debounced function was NOT called because no time has elapsed since invocation');

  this.clock.tick(50);
  assert.strictEqual(tester.callCount, 1, 'the debounced function was NOT called because the clock has NOT ticket forward enough');

  this.clock.tick(50);
  assert.strictEqual(tester.callCount, 2, 'the debounced function was called because the clock ticked forward enough');
});

QUnit.test('may immediately invoke debounced functions', function(assert) {
  assert.expect(2);

  const tester = sinon.spy();
  const debounced = Fn.debounce(tester, 100, true);

  // Called twice on each assertion to ensure that multiple calls only result
  // in a call to the inner function.
  debounced();
  debounced();
  assert.strictEqual(tester.callCount, 1, 'the debounced function was called because true was passed');

  this.clock.tick(100);
  assert.strictEqual(tester.callCount, 1, 'the debounced function was NOT called because it has only been invoked once');
});

QUnit.test('may cancel debounced functions', function(assert) {
  assert.expect(2);

  const tester = sinon.spy();
  const debounced = Fn.debounce(tester, 100);

  debounced();
  this.clock.tick(50);
  debounced.cancel();
  this.clock.tick(50);
  assert.strictEqual(tester.callCount, 0, 'the debounced function was NOT called because it was cancelled');

  debounced();
  this.clock.tick(100);
  assert.strictEqual(tester.callCount, 1, 'the debounced function was called because it was NOT cancelled');
});
