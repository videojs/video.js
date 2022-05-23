/* eslint-env qunit */
import window from 'global/window';
import sinon from 'sinon';
import {deprecate, deprecateForMajor} from '../../../src/js/utils/deprecate.js';

QUnit.module('utils/deprecate', {
  beforeEach() {

    // Back up the original console.
    this.originalConsole = window.console;

    // Replace the native console for testing. In IE8 `console.log` is not a
    // 'function' so sinon chokes on it when trying to spy:
    //   https://github.com/cjohansen/Sinon.JS/issues/386
    //
    // Instead we'll temporarily replace them with no-op functions
    window.console = {
      debug: sinon.spy(),
      info: sinon.spy(),
      log: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    };
  },
  afterEach() {

    // Restore the native/original console.
    window.console = this.originalConsole;
  }
}, function() {

  QUnit.module('deprecate');

  QUnit.test('should pass through arguments to a function and return expected value', function(assert) {
    assert.expect(1);

    const test = deprecate('test', (...args) => args);
    const result = test(1, 2, 3);

    assert.deepEqual(result, [1, 2, 3]);
  });

  QUnit.test('should maintain the correct "this" value', function(assert) {
    assert.expect(1);

    const that = {};
    const test = deprecate('test', function() {
      return this;
    }.bind(that));

    const result = test();

    assert.strictEqual(result, that, 'the "this" value was returned as the expected object');
  });

  QUnit.test('should log the specified message only once', function(assert) {
    assert.expect(2);

    const test = deprecate('test', function() {});

    test();
    test();
    test();

    assert.ok(window.console.warn.calledOnce);
    assert.deepEqual(window.console.warn.firstCall.args, ['VIDEOJS:', 'WARN:', 'test']);
  });

  QUnit.module('deprecateForMajor');

  QUnit.test('should pass through arguments to a function and return expected value', function(assert) {
    assert.expect(1);

    const test = deprecateForMajor(1, 'A', 'B', (...args) => args);
    const result = test(1, 2, 3);

    assert.deepEqual(result, [1, 2, 3]);
  });

  QUnit.test('should maintain the correct "this" value', function(assert) {
    assert.expect(1);

    const that = {};
    const test = deprecateForMajor(1, 'A', 'B', function() {
      return this;
    }.bind(that));

    const result = test();

    assert.strictEqual(result, that, 'the "this" value was returned as the expected object');
  });

  QUnit.test('should log the expected message only once', function(assert) {
    assert.expect(2);

    const test = deprecateForMajor(1, 'A', 'B', function() {});

    test();
    test();
    test();

    assert.ok(window.console.warn.calledOnce);
    assert.deepEqual(window.console.warn.firstCall.args, ['VIDEOJS:', 'WARN:', 'A is deprecated and will be removed in 1.0; please use B instead.']);
  });
});
