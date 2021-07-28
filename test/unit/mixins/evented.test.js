/* eslint-env qunit */
import sinon from 'sinon';
import evented from '../../../src/js/mixins/evented';
import log from '../../../src/js/utils/log';
import DomData from '../../../src/js/utils/dom-data';
import * as Dom from '../../../src/js/utils/dom';
import * as Obj from '../../../src/js/utils/obj';
import * as Events from '../../../src/js/utils/events.js';

// Common errors thrown by evented objects.
const errors = {
  type: (objName, fnName) => new Error(`Invalid event type for ${objName}#${fnName}; must be a non-empty string or array.`),
  listener: (objName, fnName) => new Error(`Invalid listener for ${objName}#${fnName}; must be a function.`),
  target: (objName, fnName) => new Error(`Invalid target for ${objName}#${fnName}; must be a DOM node or evented object.`),
  trigger: (objName) => new Error(`Invalid event type for ${objName}#trigger; must be a non-empty string or object with a type key that has a non-empty value.`)
};

const validateListenerCall = (call, thisValue, eventExpectation) => {
  const eventActual = call.args[0];

  QUnit.assert.strictEqual(call.thisValue, thisValue, 'the listener had the expected "this" value');
  QUnit.assert.strictEqual(typeof eventActual, 'object', 'the listener was passed an event object');

  // We don't use `deepEqual` here because we only want to test a subset of
  // properties (designated by the `eventExpectation`).
  Object.keys(eventExpectation).forEach(key => {
    QUnit.assert.strictEqual(eventActual[key], eventExpectation[key], `the event had the expected "${key}"`);
  });
};

QUnit.module('mixins: evented', {

  beforeEach() {
    this.targets = {};
  },

  afterEach() {
    Object.keys(this.targets).forEach((k) => this.targets[k].trigger('dispose'));
  }
});

QUnit.test('evented() mutates an object as expected', function(assert) {
  const target = this.targets.a = {};

  assert.strictEqual(typeof evented, 'function', 'the mixin is a function');
  assert.strictEqual(evented(target), target, 'returns the target object');

  assert.ok(Obj.isObject(target), 'the target is still an object');
  assert.ok(Dom.isEl(target.eventBusEl_), 'the target has an event bus element');
  assert.strictEqual(typeof target.off, 'function', 'the target has an off method');
  assert.strictEqual(typeof target.on, 'function', 'the target has an on method');
  assert.strictEqual(typeof target.one, 'function', 'the target has a one method');
  assert.strictEqual(typeof target.trigger, 'function', 'the target has a trigger method');
});

QUnit.test('evented() with custom element', function(assert) {
  const target = this.targets.a = evented({foo: Dom.createEl('span')}, {eventBusKey: 'foo'});

  assert.strictEqual(target.eventBusEl_, target.foo, 'the custom DOM element is re-used');

  assert.throws(
    () => evented({foo: {}}, {eventBusKey: 'foo'}),
    new Error('The eventBusKey "foo" does not refer to an element.'),
    'throws if the target does not have an element at the supplied key'
  );
});

QUnit.test('trigger() errors', function(assert) {
  class Test {}

  const tester = new Test();
  const targeta = evented(tester);
  const targetb = evented(new Test());
  const targetc = evented(new Test());
  const targetd = evented({});

  tester.log = log.createLogger('tester');

  sinon.stub(log, 'error');
  sinon.stub(tester.log, 'error');

  targetc.name_ = 'foo';

  const createTest = (lg) => (target) => {
    const objName = target.name_ || target.constructor.name || typeof target;

    assert.throws(() => target.trigger(), /^Error: Invalid event type/, 'threw an error when tried to trigger without an event');

    target.trigger('   ');
    target.trigger({});
    target.trigger({type: ''});
    target.trigger({type: '    '});

    assert.ok(lg.error.called, 'error was called');
    assert.equal(lg.error.callCount, 4, 'log.error called 4 times');
    assert.ok(lg.error.calledWithMatch(new RegExp(`^Invalid event type for ${objName}#trigger`)), 'error called with expected message');

    delete target.eventBusEl_;

    assert.throws(() => target.trigger({type: 'foo'}), new RegExp(`^Error: Invalid target for ${objName}#trigger`), 'expected error');

    lg.error.reset();
  };

  createTest(targeta.log)(targeta);
  [targetb, targetc, targetd].forEach(createTest(log));

  targeta.log.error.restore();
  log.error.restore();
});

QUnit.test('on(), one(), and any() errors', function(assert) {
  class Test {}
  const targeta = this.targets.a = evented({});
  const targetb = this.targets.b = evented({});
  const targetc = this.targets.c = evented(new Test());
  const targetd = this.targets.d = evented(new Test());

  targetd.name_ = 'foo';

  ['on', 'one', 'any'].forEach(method => {
    [targeta, targetc, targetd].forEach((target) => {
      const objName = target.name_ || target.constructor.name || typeof target;

      assert.throws(() => target[method](), errors.type(objName, method), 'expected error');
      assert.throws(() => target[method]('   '), errors.type(objName, method), 'expected error');
      assert.throws(() => target[method]([]), errors.type(objName, method), 'expected error');
      assert.throws(() => target[method]('x'), errors.listener(objName, method), 'expected error');
      assert.throws(() => target[method]({}, 'x', () => {}), errors.target(objName, method), 'expected error');
      assert.throws(() => target[method](targetb, 'x', null), errors.listener(objName, method), 'expected error');
    });
  });
});

QUnit.test('off() errors', function(assert) {
  class Test {}
  const targeta = this.targets.a = evented({});
  const targetb = this.targets.b = evented({});
  const targetc = this.targets.c = evented({});
  const targetd = this.targets.d = evented({});
  const targete = this.targets.e = evented(new Test());
  const targetf = this.targets.f = evented(new Test());

  targetf.name_ = 'foo';

  // An invalid event actually causes an invalid target error because it
  // gets passed into code that assumes the first argument is the target.
  [targeta, targete, targetf].forEach(function(target) {
    const objName = target.name_ || target.constructor.name || typeof target;

    assert.throws(() => target.off([]), errors.target(objName, 'off'), 'expected error');
    assert.throws(() => target.off({}, 'x', () => {}), errors.target(objName, 'off'), 'expected error');
    assert.throws(() => target.off(targetb, '', () => {}), errors.type(objName, 'off'), 'expected error');
    assert.throws(() => target.off(targetc, [], () => {}), errors.type(objName, 'off'), 'expected error');
    assert.throws(() => target.off(targetd, 'x', null), errors.listener(objName, 'off'), 'expected error');
    assert.throws(() => target.off(targetd, 'x', null), errors.listener(objName, 'off'), 'expected error');
  });
});

QUnit.test('on() can add a listener to one event type on this object', function(assert) {
  const a = this.targets.a = evented({});
  const spy = sinon.spy();

  a.on('x', spy);
  a.trigger('x');

  assert.strictEqual(spy.callCount, 1, 'the listener was called the expected number of times');

  validateListenerCall(spy.getCall(0), a, {
    type: 'x',
    target: a.eventBusEl_
  });
});

QUnit.test('on() can add a listener to an array of event types on this object', function(assert) {
  const a = this.targets.a = evented({});
  const spy = sinon.spy();

  a.on(['x', 'y'], spy);
  a.trigger('x');
  a.trigger('y');

  assert.strictEqual(spy.callCount, 2, 'the listener was called the expected number of times');

  validateListenerCall(spy.getCall(0), a, {
    type: 'x',
    target: a.eventBusEl_
  });

  validateListenerCall(spy.getCall(1), a, {
    type: 'y',
    target: a.eventBusEl_
  });
});

QUnit.test('one() can add a listener to one event type on this object', function(assert) {
  const a = this.targets.a = evented({});
  const spy = sinon.spy();

  a.one('x', spy);
  a.trigger('x');
  a.trigger('x');

  assert.strictEqual(spy.callCount, 1, 'the listener was called the expected number of times');

  validateListenerCall(spy.getCall(0), a, {
    type: 'x',
    target: a.eventBusEl_
  });
});

QUnit.test('one() can add a listener to an array of event types on this object', function(assert) {
  const a = this.targets.a = evented({});
  const spy = sinon.spy();

  a.one(['x', 'y'], spy);
  a.trigger('x');
  a.trigger('y');
  a.trigger('x');
  a.trigger('y');

  assert.strictEqual(spy.callCount, 2, 'the listener was called the expected number of times');

  validateListenerCall(spy.getCall(0), a, {
    type: 'x',
    target: a.eventBusEl_
  });

  validateListenerCall(spy.getCall(1), a, {
    type: 'y',
    target: a.eventBusEl_
  });
});

QUnit.test('one() can add a listener to an array of event types on this object', function(assert) {
  const a = this.targets.a = evented({});
  const spy = sinon.spy();

  a.one(['x', 'y'], spy);
  a.trigger('x');
  a.trigger('y');
  a.trigger('x');
  a.trigger('y');

  assert.strictEqual(spy.callCount, 2, 'the listener was called the expected number of times');

  validateListenerCall(spy.getCall(0), a, {
    type: 'x',
    target: a.eventBusEl_
  });

  validateListenerCall(spy.getCall(1), a, {
    type: 'y',
    target: a.eventBusEl_
  });
});

QUnit.test('any() can add a listener to one event type on this object', function(assert) {
  const a = this.targets.a = evented({});
  const spy = sinon.spy();

  a.any('x', spy);
  a.trigger('x');
  a.trigger('x');

  assert.strictEqual(spy.callCount, 1, 'the listener was called the expected number of times');

  validateListenerCall(spy.getCall(0), a, {
    type: 'x',
    target: a.eventBusEl_
  });
});

QUnit.test('any() can add a listener to an array of event types on this object', function(assert) {
  const a = this.targets.a = evented({});
  const spy = sinon.spy();

  a.any(['x', 'y'], spy);
  a.trigger('x');
  a.trigger('y');
  a.trigger('x');
  a.trigger('y');

  assert.strictEqual(spy.callCount, 1, 'the listener was called the expected number of times');

  validateListenerCall(spy.getCall(0), a, {
    type: 'x',
    target: a.eventBusEl_
  });
});

QUnit.test('on() can add a listener to one event type on a different target object', function(assert) {
  const a = this.targets.a = evented({});
  const b = this.targets.b = evented({});
  const spy = sinon.spy();

  a.on(b, 'x', spy);
  b.trigger('x');

  // Make sure we aren't magically binding a listener to "a".
  a.trigger('x');

  assert.strictEqual(spy.callCount, 1, 'the listener was called the expected number of times');

  validateListenerCall(spy.getCall(0), a, {
    type: 'x',
    target: b.eventBusEl_
  });
});

QUnit.test('on() can add a listener to an array of event types on a different target object', function(assert) {
  const a = this.targets.a = evented({});
  const b = this.targets.b = evented({});
  const spy = sinon.spy();

  a.on(b, ['x', 'y'], spy);
  b.trigger('x');
  b.trigger('y');

  // Make sure we aren't magically binding a listener to "a".
  a.trigger('x');
  a.trigger('y');

  assert.strictEqual(spy.callCount, 2, 'the listener was called the expected number of times');

  validateListenerCall(spy.getCall(0), a, {
    type: 'x',
    target: b.eventBusEl_
  });

  validateListenerCall(spy.getCall(1), a, {
    type: 'y',
    target: b.eventBusEl_
  });
});

QUnit.test('one() can add a listener to one event type on a different target object', function(assert) {
  const a = this.targets.a = evented({});
  const b = this.targets.b = evented({});
  const spy = sinon.spy();

  a.one(b, 'x', spy);
  b.trigger('x');

  // Make sure we aren't magically binding a listener to "a".
  a.trigger('x');

  assert.strictEqual(spy.callCount, 1, 'the listener was called the expected number of times');

  validateListenerCall(spy.getCall(0), a, {
    type: 'x',
    target: b.eventBusEl_
  });
});

// TODO: This test is incorrect! this listener should be called twice,
//       but instead all listners are removed on the first trigger!
//       see https://github.com/videojs/video.js/issues/5962
QUnit.test('one() can add a listener to an array of event types on a different target object', function(assert) {
  const a = this.targets.a = evented({});
  const b = this.targets.b = evented({});
  const spy = sinon.spy();

  a.one(b, ['x', 'y'], spy);
  b.trigger('x');
  b.trigger('y');
  b.trigger('x');
  b.trigger('y');

  // Make sure we aren't magically binding a listener to "a".
  a.trigger('x');
  a.trigger('y');

  assert.strictEqual(spy.callCount, 1, 'the listener was called the expected number of times');

  validateListenerCall(spy.getCall(0), a, {
    type: 'x',
    target: b.eventBusEl_
  });
});

QUnit.test('any() can add a listener to one event type on a different target object', function(assert) {
  const a = this.targets.a = evented({});
  const b = this.targets.b = evented({});
  const spy = sinon.spy();

  a.any(b, 'x', spy);
  b.trigger('x');

  // Make sure we aren't magically binding a listener to "a".
  a.trigger('x');

  assert.strictEqual(spy.callCount, 1, 'the listener was called the expected number of times');

  validateListenerCall(spy.getCall(0), a, {
    type: 'x',
    target: b.eventBusEl_
  });
});

QUnit.test('any() can add a listener to an array of event types on a different target object', function(assert) {
  const a = this.targets.a = evented({});
  const b = this.targets.b = evented({});
  const spy = sinon.spy();

  a.any(b, ['x', 'y'], spy);
  b.trigger('x');
  b.trigger('y');
  b.trigger('x');
  b.trigger('y');

  // Make sure we aren't magically binding a listener to "a".
  a.trigger('x');
  a.trigger('y');

  assert.strictEqual(spy.callCount, 1, 'the listener was called the expected number of times');

  validateListenerCall(spy.getCall(0), a, {
    type: 'x',
    target: b.eventBusEl_
  });
});

QUnit.test('off() with no arguments will remove all listeners from all events on this object', function(assert) {
  const a = this.targets.a = evented({});
  const spyX = sinon.spy();
  const spyY = sinon.spy();

  a.on('x', spyX);
  a.on('y', spyY);
  a.trigger('x');
  a.trigger('y');
  a.off();
  a.trigger('x');
  a.trigger('y');

  assert.strictEqual(spyX.callCount, 1, 'the listener was called the expected number of times');

  validateListenerCall(spyX.getCall(0), a, {
    type: 'x',
    target: a.eventBusEl_
  });

  assert.strictEqual(spyY.callCount, 1, 'the listener was called the expected number of times');

  validateListenerCall(spyY.getCall(0), a, {
    type: 'y',
    target: a.eventBusEl_
  });
});

QUnit.test('off() can remove all listeners from a single event on this object', function(assert) {
  const a = this.targets.a = evented({});
  const spyX = sinon.spy();
  const spyY = sinon.spy();

  a.on('x', spyX);
  a.on('y', spyY);
  a.trigger('x');
  a.trigger('y');
  a.off('x');
  a.trigger('x');
  a.trigger('y');

  assert.strictEqual(spyX.callCount, 1, 'the listener was called the expected number of times');

  validateListenerCall(spyX.getCall(0), a, {
    type: 'x',
    target: a.eventBusEl_
  });

  assert.strictEqual(spyY.callCount, 2, 'the listener was called the expected number of times');

  validateListenerCall(spyY.getCall(0), a, {
    type: 'y',
    target: a.eventBusEl_
  });

  validateListenerCall(spyY.getCall(1), a, {
    type: 'y',
    target: a.eventBusEl_
  });
});

QUnit.test('off() can remove a listener from a single event on this object', function(assert) {
  const a = this.targets.a = evented({});
  const spyX1 = sinon.spy();
  const spyX2 = sinon.spy();
  const spyY = sinon.spy();

  a.on('x', spyX1);
  a.on('x', spyX2);
  a.on('y', spyY);
  a.trigger('x');
  a.trigger('y');
  a.off('x', spyX1);
  a.trigger('x');
  a.trigger('y');

  assert.strictEqual(spyX1.callCount, 1, 'the listener was called the expected number of times');

  validateListenerCall(spyX1.getCall(0), a, {
    type: 'x',
    target: a.eventBusEl_
  });

  assert.strictEqual(spyX2.callCount, 2, 'the listener was called the expected number of times');

  validateListenerCall(spyX2.getCall(0), a, {
    type: 'x',
    target: a.eventBusEl_
  });

  validateListenerCall(spyX2.getCall(1), a, {
    type: 'x',
    target: a.eventBusEl_
  });

  assert.strictEqual(spyY.callCount, 2, 'the listener was called the expected number of times');

  validateListenerCall(spyY.getCall(0), a, {
    type: 'y',
    target: a.eventBusEl_
  });

  validateListenerCall(spyY.getCall(1), a, {
    type: 'y',
    target: a.eventBusEl_
  });
});

QUnit.test('off() can remove a listener from a single event on a different target object', function(assert) {
  const a = this.targets.a = evented({});
  const b = this.targets.b = evented({});
  const spy = sinon.spy();

  a.on(b, 'x', spy);
  b.trigger('x');
  a.off(b, 'x', spy);
  b.trigger('x');

  assert.strictEqual(spy.callCount, 1, 'the listener was called the expected number of times');

  validateListenerCall(spy.getCall(0), a, {
    type: 'x',
    target: b.eventBusEl_
  });
});

QUnit.test('off() can remove a listener from an array of events on a different target object', function(assert) {
  const a = this.targets.a = evented({});
  const b = this.targets.b = evented({});
  const spy = sinon.spy();

  a.on(b, ['x', 'y'], spy);
  b.trigger('x');
  b.trigger('y');
  a.off(b, ['x', 'y'], spy);
  b.trigger('x');
  b.trigger('y');

  assert.strictEqual(spy.callCount, 2, 'the listener was called the expected number of times');

  validateListenerCall(spy.getCall(0), a, {
    type: 'x',
    target: b.eventBusEl_
  });

  validateListenerCall(spy.getCall(1), a, {
    type: 'y',
    target: b.eventBusEl_
  });
});

QUnit.test('Removes DomData on dispose', function(assert) {
  const el_ = Dom.createEl('div');
  const eventBusEl_ = Dom.createEl('span', {className: 'vjs-event-bus'});
  const target = evented({el_, eventBusEl_}, {eventBusKey: 'eventBusEl_'});

  assert.equal(DomData.get(eventBusEl_).handlers.dispose.length, 1, 'event bus has dispose handler');
  assert.notOk(DomData.get(target), 'evented obj has no handlers');
  assert.notOk(DomData.get(el_), 'evented el_ has handlers');

  target.on('foo', () => {});

  assert.equal(DomData.get(eventBusEl_).handlers.foo.length, 1, 'foo handler added to bus');

  Events.on(eventBusEl_, 'bar', () => {});
  assert.equal(DomData.get(eventBusEl_).handlers.bar.length, 1, 'bar handler added to bus');

  Events.on(el_, 'foo', () => {});
  assert.equal(DomData.get(el_).handlers.foo.length, 1, 'foo handler added to el_');

  Events.on(target, 'foo', () => {});
  assert.equal(DomData.get(target).handlers.foo.length, 1, 'foo handler added to evented object');

  target.trigger('dispose');
  assert.notOk(DomData.get(eventBusEl_), 'eventBusEl_ DomData deleted');
  assert.notOk(DomData.get(target), 'evented object DomData deleted');
  assert.notOk(DomData.get(el_), 'el_ DomData deleted');
});
