/* eslint-env qunit */
import log from '../../../src/js/utils/log.js';
import window from 'global/window';
import sinon from 'sinon';

QUnit.module('utils/log', {

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

    // Restore the default logging level.
    log.level(log.levels.DEFAULT);

    // Empty the logger's history.
    log.history.clear();
  }
});

QUnit.test('logging functions should work', function(assert) {

  // Need to reset history here because there are extra messages logged
  // when running via Karma.
  log.history.clear();

  log('log1', 'log2');
  log.debug('debug1', 'debug2');
  log.warn('warn1', 'warn2');
  log.error('error1', 'error2');

  assert.ok(window.console.log.called, 'log was called');
  assert.deepEqual(
    window.console.log.firstCall.args,
    ['VIDEOJS:', 'log1', 'log2']
  );

  // debug isn't enabled by default
  assert.notOk(window.console.debug.called, 'debug was not called');

  assert.ok(window.console.warn.called, 'warn was called');
  assert.deepEqual(
    window.console.warn.firstCall.args,
    ['VIDEOJS:', 'WARN:', 'warn1', 'warn2']
  );

  assert.ok(window.console.error.called, 'error was called');
  assert.deepEqual(
    window.console.error.firstCall.args,
    ['VIDEOJS:', 'ERROR:', 'error1', 'error2']
  );

  const history = log.history();

  assert.equal(history.length, 4, 'there should be four messages in the log history');
  assert.deepEqual(
    history[0],
    ['VIDEOJS:', 'log1', 'log2'],
    'history recorded the correct arguments'
  );
  // although not enabled by default, history should still maintain the record
  assert.deepEqual(
    history[1],
    ['VIDEOJS:', 'DEBUG:', 'debug1', 'debug2'],
    'history recorded the correct arguments'
  );
  assert.deepEqual(
    history[2],
    ['VIDEOJS:', 'WARN:', 'warn1', 'warn2'],
    'history recorded the correct arguments'
  );
  assert.deepEqual(
    history[3],
    ['VIDEOJS:', 'ERROR:', 'error1', 'error2'],
    'history recorded the correct arguments'
  );
});

QUnit.test('setting the log level changes what is actually logged', function(assert) {

  // Need to reset history here because there are extra messages logged
  // when running via Karma.
  log.history.clear();

  log.level('error');

  log('log1', 'log2');
  log.warn('warn1', 'warn2');
  log.error('error1', 'error2');

  assert.notOk(window.console.log.called, 'console.log was not called');
  assert.notOk(window.console.warn.called, 'console.warn was not called');
  assert.ok(window.console.error.called, 'console.error was called');

  const history = log.history();

  assert.deepEqual(history[0], ['VIDEOJS:', 'log1', 'log2'], 'history is maintained even when logging is not performed');
  assert.deepEqual(history[1], ['VIDEOJS:', 'WARN:', 'warn1', 'warn2'], 'history is maintained even when logging is not performed');
  assert.deepEqual(history[2], ['VIDEOJS:', 'ERROR:', 'error1', 'error2'], 'history is maintained even when logging is not performed');

  log.level('off');

  log('log1', 'log2');
  log.warn('warn1', 'warn2');
  log.error('error1', 'error2');

  assert.notOk(window.console.log.called, 'console.log was not called');
  assert.notOk(window.console.warn.called, 'console.warn was not called');
  assert.strictEqual(window.console.error.callCount, 1, 'console.error was not called again');

  assert.throws(
    () => log.level('foobar'),
    new Error('"foobar" in not a valid log level'),
    'log.level() only accepts valid log levels when used as a setter'
  );
});

QUnit.test('history can be enabled/disabled', function(assert) {

  // Need to reset history here because there are extra messages logged
  // when running via Karma.
  log.history.clear();

  log.history.disable();
  log('log1');
  log.warn('warn1');
  log.error('error1');

  let history = log.history();

  assert.strictEqual(history.length, 0, 'no history was tracked');

  log.history.enable();
  log('log1');
  log.warn('warn1');
  log.error('error1');

  history = log.history();

  assert.strictEqual(history.length, 3, 'history was tracked');
});

QUnit.test('supports debug logging', function(assert) {
  // Need to reset history here because there are extra messages logged
  // when running via Karma.
  log.history.clear();

  log.level('debug');

  log('log1', 'log2');
  log.debug('debug1', 'debug2');
  log.warn('warn1', 'warn2');
  log.error('error1', 'error2');

  assert.ok(window.console.log.called, 'console.log was called');
  assert.ok(window.console.debug.called, 'console.debug was called');
  assert.ok(window.console.warn.called, 'console.warn was called');
  assert.ok(window.console.error.called, 'console.error called');

  const history = log.history();

  assert.equal(history.length, 4, 'four messages in history');
  assert.deepEqual(history[0], ['VIDEOJS:', 'log1', 'log2'], 'history is maintained');
  assert.deepEqual(history[1], ['VIDEOJS:', 'DEBUG:', 'debug1', 'debug2'], 'history is maintained');
  assert.deepEqual(history[2], ['VIDEOJS:', 'WARN:', 'warn1', 'warn2'], 'history is maintained');
  assert.deepEqual(history[3], ['VIDEOJS:', 'ERROR:', 'error1', 'error2'], 'history is maintained');
});

QUnit.test('falls back to info and log when debug is not supported', function(assert) {
  // Need to reset history here because there are extra messages logged
  // when running via Karma.
  log.history.clear();

  log.level('debug');

  window.console.debug = null;
  log.debug('debug1', 'debug2');

  assert.ok(window.console.info.called, 'info was called');
  assert.notOk(window.console.log.called, 'log was not called');
  assert.notOk(window.console.warn.called, 'warn was not called');
  assert.notOk(window.console.error.called, 'error was not called');
  assert.deepEqual(
    window.console.info.firstCall.args,
    ['VIDEOJS:', 'DEBUG:', 'debug1', 'debug2'],
    'logged the right message'
  );

  window.console.info = null;
  log.debug('debug3', 'debug4');

  assert.ok(window.console.log.called, 'log was called');
  assert.notOk(window.console.warn.called, 'warn was not called');
  assert.notOk(window.console.error.called, 'error was not called');
  assert.deepEqual(
    window.console.log.firstCall.args,
    ['VIDEOJS:', 'DEBUG:', 'debug3', 'debug4'],
    'logged the right message'
  );

  // when no comparable level logs are available, there should not be any logging
  window.console.log = null;
  log.debug('debug5', 'debug6');

  assert.notOk(window.console.warn.called, 'warn was not called');
  assert.notOk(window.console.error.called, 'error was not called');
});

QUnit.test('history only retains 1000 items', function(assert) {
  // Need to reset history here because there are extra messages logged
  // when running via Karma.
  log.history.clear();

  for (let i = 1; i <= 1005; i++) {
    log(i);
  }

  const hist = log.history();

  assert.equal(hist.length, 1000, 'only 1000 items in history');
  assert.deepEqual([hist[0], hist[hist.length - 1 ]], [['VIDEOJS:', 6], ['VIDEOJS:', 1005]], 'keeps most recent items');
});

QUnit.test('create logger should create sub-logger with naming chain', function(assert) {
  log.history.clear();

  const subLogger = log.createLogger('SubModule');

  subLogger.level('debug');

  subLogger('log1', 'log2');
  subLogger.debug('debug1', 'debug2');
  subLogger.warn('warn1', 'warn2');
  subLogger.error('error1', 'error2');

  assert.ok(window.console.log.called, 'console.log was called');
  assert.ok(window.console.debug.called, 'console.debug was called');
  assert.ok(window.console.warn.called, 'console.warn was called');
  assert.ok(window.console.error.called, 'console.error called');

  const history = log.history();

  assert.equal(history.length, 4, 'four messages in history');
  assert.deepEqual(history[0], ['VIDEOJS : SubModule:', 'log1', 'log2'], 'history is maintained');
  assert.deepEqual(history[1], ['VIDEOJS : SubModule:', 'DEBUG:', 'debug1', 'debug2'], 'history is maintained');
  assert.deepEqual(history[2], ['VIDEOJS : SubModule:', 'WARN:', 'warn1', 'warn2'], 'history is maintained');
  assert.deepEqual(history[3], ['VIDEOJS : SubModule:', 'ERROR:', 'error1', 'error2'], 'history is maintained');
});

QUnit.test('create a new logger should override existing sub names', function(assert) {
  log.history.clear();

  const newLogger = log.createNewLogger('Module');

  newLogger.level('debug');

  newLogger('log1', 'log2');
  newLogger.debug('debug1', 'debug2');
  newLogger.warn('warn1', 'warn2');
  newLogger.error('error1', 'error2');

  assert.ok(window.console.log.called, 'console.log was called');
  assert.ok(window.console.debug.called, 'console.debug was called');
  assert.ok(window.console.warn.called, 'console.warn was called');
  assert.ok(window.console.error.called, 'console.error called');

  const history = log.history();

  assert.equal(history.length, 4, 'four messages in history');
  assert.deepEqual(history[0], ['Module:', 'log1', 'log2'], 'history is maintained');
  assert.deepEqual(history[1], ['Module:', 'DEBUG:', 'debug1', 'debug2'], 'history is maintained');
  assert.deepEqual(history[2], ['Module:', 'WARN:', 'warn1', 'warn2'], 'history is maintained');
  assert.deepEqual(history[3], ['Module:', 'ERROR:', 'error1', 'error2'], 'history is maintained');
});

QUnit.test('create logger applies delimiter and styles if presented', function(assert) {
  log.history.clear();

  const subLogger = log.createLogger('SubModule', '>', 'background: #333; padding: 3px; color: #bada55');

  subLogger.level('debug');

  subLogger('log1', 'log2');
  subLogger.debug('debug1', 'debug2');
  subLogger.warn('warn1', 'warn2');
  subLogger.error('error1', 'error2');

  assert.ok(window.console.log.called, 'console.log was called');
  assert.ok(window.console.debug.called, 'console.debug was called');
  assert.ok(window.console.warn.called, 'console.warn was called');
  assert.ok(window.console.error.called, 'console.error called');

  const history = log.history();

  assert.equal(history.length, 4, 'four messages in history');
  assert.deepEqual(history[0], ['%cVIDEOJS > SubModule:', 'background: #333; padding: 3px; color: #bada55', 'log1', 'log2'], 'history is maintained');
  assert.deepEqual(history[1], ['%cVIDEOJS > SubModule:', 'background: #333; padding: 3px; color: #bada55', 'DEBUG:', 'debug1', 'debug2'], 'history is maintained');
  assert.deepEqual(history[2], ['%cVIDEOJS > SubModule:', 'background: #333; padding: 3px; color: #bada55', 'WARN:', 'warn1', 'warn2'], 'history is maintained');
  assert.deepEqual(history[3], ['%cVIDEOJS > SubModule:', 'background: #333; padding: 3px; color: #bada55', 'ERROR:', 'error1', 'error2'], 'history is maintained');
});

QUnit.test('create new logger applies delimiter and styles if presented', function(assert) {
  log.history.clear();

  const newLogger = log.createNewLogger('Module', '>', 'background: #333; padding: 3px; color: #bada55');
  const subModule1 = newLogger.createLogger('SubModule1');
  const subModule2 = subModule1.createLogger('SubModule2', '->', '');

  newLogger.level('debug');

  newLogger('log1', 'log2');
  newLogger.debug('debug1', 'debug2');
  newLogger.warn('warn1', 'warn2');
  newLogger.error('error1', 'error2');

  subModule1('log1', 'log2');
  subModule1.debug('debug1', 'debug2');
  subModule1.warn('warn1', 'warn2');
  subModule1.error('error1', 'error2');

  subModule2('log1', 'log2');
  subModule2.debug('debug1', 'debug2');
  subModule2.warn('warn1', 'warn2');
  subModule2.error('error1', 'error2');

  assert.ok(window.console.log.called, 'console.log was called');
  assert.ok(window.console.debug.called, 'console.debug was called');
  assert.ok(window.console.warn.called, 'console.warn was called');
  assert.ok(window.console.error.called, 'console.error called');

  const history = log.history();

  assert.equal(history.length, 12, '12 messages in history');
  assert.deepEqual(history[0], ['%cModule:', 'background: #333; padding: 3px; color: #bada55', 'log1', 'log2'], 'history is maintained');
  assert.deepEqual(history[1], ['%cModule:', 'background: #333; padding: 3px; color: #bada55', 'DEBUG:', 'debug1', 'debug2'], 'history is maintained');
  assert.deepEqual(history[2], ['%cModule:', 'background: #333; padding: 3px; color: #bada55', 'WARN:', 'warn1', 'warn2'], 'history is maintained');
  assert.deepEqual(history[3], ['%cModule:', 'background: #333; padding: 3px; color: #bada55', 'ERROR:', 'error1', 'error2'], 'history is maintained');

  assert.deepEqual(history[4], ['%cModule > SubModule1:', 'background: #333; padding: 3px; color: #bada55', 'log1', 'log2'], 'history is maintained');
  assert.deepEqual(history[5], ['%cModule > SubModule1:', 'background: #333; padding: 3px; color: #bada55', 'DEBUG:', 'debug1', 'debug2'], 'history is maintained');
  assert.deepEqual(history[6], ['%cModule > SubModule1:', 'background: #333; padding: 3px; color: #bada55', 'WARN:', 'warn1', 'warn2'], 'history is maintained');
  assert.deepEqual(history[7], ['%cModule > SubModule1:', 'background: #333; padding: 3px; color: #bada55', 'ERROR:', 'error1', 'error2'], 'history is maintained');

  assert.deepEqual(history[8], ['Module > SubModule1 -> SubModule2:', 'log1', 'log2'], 'history is maintained');
  assert.deepEqual(history[9], ['Module > SubModule1 -> SubModule2:', 'DEBUG:', 'debug1', 'debug2'], 'history is maintained');
  assert.deepEqual(history[10], ['Module > SubModule1 -> SubModule2:', 'WARN:', 'warn1', 'warn2'], 'history is maintained');
  assert.deepEqual(history[11], ['Module > SubModule1 -> SubModule2:', 'ERROR:', 'error1', 'error2'], 'history is maintained');
});
