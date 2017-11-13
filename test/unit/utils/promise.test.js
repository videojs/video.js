/* eslint-env qunit */
import window from 'global/window';
import * as promise from '../../../src/js/utils/promise';

QUnit.module('utils/promise');

QUnit.test('can correctly identify a native Promise (if supported)', function(assert) {

  // If Promises aren't supported, skip this.
  if (!window.Promise) {
    return assert.expect(0);
  }

  assert.ok(promise.isPromise(new window.Promise((resolve) => resolve())), 'a native Promise was recognized');
});

QUnit.test('can identify a Promise-like object', function(assert) {
  assert.notOk(promise.isPromise({}), 'an object without a `then` method is not Promise-like');
  assert.ok(promise.isPromise({then: () => {}}), 'an object with a `then` method is Promise-like');
});
