/* eslint-env qunit */
import window from 'global/window';
import * as promise from '../../../src/js/utils/promise';

QUnit.module('utils/promise');

QUnit.test('can correctly identify a native Promise (if supported)', function(assert) {
  if (!window.Promise) {
    assert.expect(0);
    return;
  }

  assert.ok(promise.isPromise(new window.Promise((resolve) => resolve())));
});

QUnit.test('can identify a Promise-like object', function(assert) {
  assert.notOk(promise.isPromise({}));
  assert.ok(promise.isPromise({then: () => {}}));
});
