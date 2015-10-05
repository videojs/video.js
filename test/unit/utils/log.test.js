import log from '../../../src/js/utils/log.js';
import window from 'global/window';

q.module('log');

test('should confirm logging functions work', function() {
  let origConsole = window['console'];
  // replace the native console for testing
  // in ie8 console.log is apparently not a 'function' so sinon chokes on it
  // https://github.com/cjohansen/Sinon.JS/issues/386
  // instead we'll temporarily replace them with no-op functions
  let console = window['console'] = {
    log: function(){},
    warn: function(){},
    error: function(){}
  };

  // stub the global log functions
  let logStub = sinon.stub(console, 'log');
  let errorStub = sinon.stub(console, 'error');
  let warnStub = sinon.stub(console, 'warn');

  // Reset the log history
  log.history = [];

  log('log1', 'log2');
  log.warn('warn1', 'warn2');
  log.error('error1', 'error2');

  ok(logStub.called, 'log was called');
  equal(logStub.firstCall.args[0], 'VIDEOJS:');
  equal(logStub.firstCall.args[1], 'log1');
  equal(logStub.firstCall.args[2], 'log2');

  ok(warnStub.called, 'warn was called');
  equal(warnStub.firstCall.args[0], 'VIDEOJS:');
  equal(warnStub.firstCall.args[1], 'WARN:');
  equal(warnStub.firstCall.args[2], 'warn1');
  equal(warnStub.firstCall.args[3], 'warn2');

  ok(errorStub.called, 'error was called');
  equal(errorStub.firstCall.args[0], 'VIDEOJS:');
  equal(errorStub.firstCall.args[1], 'ERROR:');
  equal(errorStub.firstCall.args[2], 'error1');
  equal(errorStub.firstCall.args[3], 'error2');

  equal(log.history.length, 3, 'there should be three messages in the log history');

  // tear down sinon
  logStub.restore();
  errorStub.restore();
  warnStub.restore();

  // restore the native console
  window['console'] = origConsole;
});
