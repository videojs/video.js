/* eslint-env qunit */
import timeExpiringCache from '../../../src/js/tech/flash-cache.js';
import sinon from 'sinon';

QUnit.module('Flash Cache', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
  },
  afterEach() {
    this.clock.restore();
  }
});

QUnit.test('calls the getter on first invocation', function(assert) {
  let calls = 0;
  const cached = timeExpiringCache(() => calls++, 100);

  QUnit.equal(cached(), 0, 'returned a value');
  QUnit.equal(calls, 1, 'called the getter');
});

QUnit.test('caches results', function(assert) {
  let calls = 0;
  const cached = timeExpiringCache(() => calls++, 100);

  for (let i = 0; i < 31; i++) {
    QUnit.equal(cached(), 0, 'returned a cached value');
  }
  QUnit.equal(calls, 1, 'only called getter once');
});

QUnit.test('refreshes the cache after the result expires', function(assert) {
  let calls = 0;
  const cached = timeExpiringCache(() => calls++, 1);

  QUnit.equal(cached(), 0, 'returned a value');
  QUnit.equal(cached(), 0, 'returned a cached value');
  QUnit.equal(calls, 1, 'only called getter once');
  this.clock.tick(1);

  QUnit.equal(cached(), 1, 'returned a value');
  QUnit.equal(cached(), 1, 'returned a cached value');
  QUnit.equal(calls, 2, 'called getter again');

  this.clock.tick(10);
  QUnit.equal(calls, 2, 'only refreshes on-demand');
  QUnit.equal(cached(), 2, 'returned a value');
  QUnit.equal(cached(), 2, 'returned a cached value');
  QUnit.equal(calls, 3, 'called getter again');
});
