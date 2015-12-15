import createDeprecationProxy from '../../../src/js/utils/create-deprecation-proxy.js';
import log from '../../../src/js/utils/log.js';

const proxySupported = typeof Proxy === 'function';

test('should return a Proxy object when supported or the target object by reference', function() {
  let target = {foo: 1};
  let subject = createDeprecationProxy(target, {
    get: 'get message',
    set: 'set message'
  });

  // Testing for a Proxy is really difficult because Proxy objects by their
  // nature disguise the fact that they are in fact Proxy objects. So, this
  // tests that the log.warn method gets called on property get/set operations
  // to detect the Proxy.
  if (proxySupported) {
    sinon.stub(log, 'warn');

    subject.foo; // Triggers a "get"
    subject.foo = 2; // Triggers a "set"

    equal(log.warn.callCount, 2, 'proxied operations cause deprecation warnings');
    ok(log.warn.calledWith('get message'), 'proxied get logs expected message');
    ok(log.warn.calledWith('set message'), 'proxied set logs expected message');

    log.warn.restore();
  } else {
    strictEqual(target, subject, 'identical to target');
  }
});

// Tests run only in Proxy-supporting environments.
if (proxySupported) {
  test('no deprecation warning is logged for operations without a message', function() {
    let subject = createDeprecationProxy({}, {
      get: 'get message'
    });

    sinon.stub(log, 'warn');
    subject.foo = 'bar'; // Triggers a "set," but not a "get"
    equal(log.warn.callCount, 0, 'no deprecation warning expected');
    log.warn.restore();
  });
}
