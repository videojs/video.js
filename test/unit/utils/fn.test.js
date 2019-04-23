/* eslint-env qunit */
import sinon from 'sinon';
import * as Fn from '../../../src/js/utils/fn.js';

QUnit.module('fn', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
  },
  afterEach() {
    this.clock.restore();
  }
});

QUnit.test('should add context to a function', function(assert) {
  const newContext = { test: 'obj'};
  const asdf = function() {
    assert.ok(this === newContext);
  };
  const fdsa = Fn.bind(newContext, asdf);

  fdsa();
});

QUnit.test('should throttle functions properly', function(assert) {
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
