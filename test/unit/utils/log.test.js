/* eslint-env qunit */
import {IE_VERSION} from '../../../src/js/utils/browser';
import log from '../../../src/js/utils/log.js';
import {logByType} from '../../../src/js/utils/log.js';
import window from 'global/window';
import sinon from 'sinon';

QUnit.module('log', {

  beforeEach() {

    // Back up the original console.
    this.originalConsole = window.console;

    // Replace the native console for testing. In IE8 `console.log` is not a
    // 'function' so sinon chokes on it when trying to spy:
    //   https://github.com/cjohansen/Sinon.JS/issues/386
    //
    // Instead we'll temporarily replace them with no-op functions
    window.console = {
      log: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy()
    };
  },

  afterEach() {

    // Restore the native/original console.
    window.console = this.originalConsole;

    // Restore the default logging level.
    log.level(log.levels.DEFAULT);

    // Empty the logger's history.
    log.history.length = 0;
  }
});

const getConsoleArgs = (...arr) =>
  IE_VERSION && IE_VERSION < 11 ? [arr.join(' ')] : arr;

QUnit.test('logging functions should work', function(assert) {

  // Need to reset history here because there are extra messages logged
  // when running via Karma.
  log.history.length = 0;

  log('log1', 'log2');
  log.warn('warn1', 'warn2');
  log.error('error1', 'error2');

  assert.ok(window.console.log.called, 'log was called');
  assert.deepEqual(
    window.console.log.firstCall.args,
    getConsoleArgs('VIDEOJS:', 'log1', 'log2')
  );

  assert.ok(window.console.warn.called, 'warn was called');
  assert.deepEqual(
    window.console.warn.firstCall.args,
    getConsoleArgs('VIDEOJS:', 'WARN:', 'warn1', 'warn2')
  );

  assert.ok(window.console.error.called, 'error was called');
  assert.deepEqual(
    window.console.error.firstCall.args,
    getConsoleArgs('VIDEOJS:', 'ERROR:', 'error1', 'error2')
  );

  assert.equal(log.history.length, 3, 'there should be three messages in the log history');
  assert.deepEqual(log.history[0], ['log1', 'log2'], 'history recorded the correct arguments');
  assert.deepEqual(log.history[1], ['WARN:', 'warn1', 'warn2'], 'history recorded the correct arguments');
  assert.deepEqual(log.history[2], ['ERROR:', 'error1', 'error2'], 'history recorded the correct arguments');
});

QUnit.test('in IE pre-11 (or when requested) objects and arrays are stringified', function(assert) {

  // Need to reset history here because there are extra messages logged
  // when running via Karma.
  log.history.length = 0;

  // Run a custom log call, explicitly requesting object/array stringification.
  logByType('log', [
    'test',
    {foo: 'bar'},
    [1, 2, 3],
    0,
    false,
    null
  ], true);

  assert.ok(window.console.log.called, 'log was called');
  assert.deepEqual(window.console.log.firstCall.args,
            ['VIDEOJS: test {"foo":"bar"} [1,2,3] 0 false null']);
});

QUnit.test('setting the log level changes what is actually logged', function(assert) {

  // Need to reset history here because there are extra messages logged
  // when running via Karma.
  log.history.length = 0;

  log.level('error');

  log('log1', 'log2');
  log.warn('warn1', 'warn2');
  log.error('error1', 'error2');

  assert.notOk(window.console.log.called, 'console.log was not called');
  assert.notOk(window.console.warn.called, 'console.warn was not called');
  assert.ok(window.console.error.called, 'console.error was called');

  assert.deepEqual(log.history[0], ['log1', 'log2'], 'history is maintained even when logging is not performed');
  assert.deepEqual(log.history[1], ['WARN:', 'warn1', 'warn2'], 'history is maintained even when logging is not performed');
  assert.deepEqual(log.history[2], ['ERROR:', 'error1', 'error2'], 'history is maintained even when logging is not performed');

  log.level('off');

  log('log1', 'log2');
  log.warn('warn1', 'warn2');
  log.error('error1', 'error2');

  assert.notOk(window.console.log.called, 'console.log was not called');
  assert.notOk(window.console.warn.called, 'console.warn was not called');
  assert.strictEqual(window.console.error.callCount, 1, 'console.error was not called again');

  assert.throws(
    () => log.level('foobar'),
    new Error(`"foobar" in not a valid log level. try one of: "${Object.keys(log.levels).join('", "')}"`),
    'log.level() only accepts valid log levels when used as a setter'
  );
});
