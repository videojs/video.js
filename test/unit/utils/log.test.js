import {IE_VERSION} from '../../../src/js/utils/browser';
import log from '../../../src/js/utils/log.js';
import {logByType} from '../../../src/js/utils/log.js';
import window from 'global/window';

q.module('log', {

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

    // Empty the logger's history.
    log.history.length = 0;
  }
});

const getConsoleArgs = (...arr) =>
  IE_VERSION && IE_VERSION < 11 ? [arr.join(' ')] : arr;

test('logging functions should work', function() {

  // Need to reset history here because there are extra messages logged
  // when running via Karma.
  log.history.length = 0;

  log('log1', 'log2');
  log.warn('warn1', 'warn2');
  log.error('error1', 'error2');

  ok(window.console.log.called, 'log was called');
  deepEqual(
    window.console.log.firstCall.args,
    getConsoleArgs('VIDEOJS:', 'log1', 'log2')
  );

  ok(window.console.warn.called, 'warn was called');
  deepEqual(
    window.console.warn.firstCall.args,
    getConsoleArgs('VIDEOJS:', 'WARN:', 'warn1', 'warn2')
  );

  ok(window.console.error.called, 'error was called');
  deepEqual(
    window.console.error.firstCall.args,
    getConsoleArgs('VIDEOJS:', 'ERROR:', 'error1', 'error2')
  );

  equal(log.history.length, 3, 'there should be three messages in the log history');
});

test('in IE pre-11 (or when requested) objects and arrays are stringified', function() {

  // Run a custom log call, explicitly requesting object/array stringification.
  logByType('log', [
    'test',
    {foo: 'bar'},
    [1, 2, 3],
    0,
    false,
    null
  ], true);

  ok(window.console.log.called, 'log was called');
  deepEqual(window.console.log.firstCall.args,
            ['VIDEOJS: test {"foo":"bar"} [1,2,3] 0 false null']);
});
