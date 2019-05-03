/* eslint-env qunit */
import sinon from 'sinon';
import evented from '../../../src/js/mixins/evented';
import * as Dom from '../../../src/js/utils/dom';
import * as Obj from '../../../src/js/utils/obj';

// Common errors thrown by evented objects.
const errors = {
  type: new Error('Invalid event type; must be a non-empty string or array.'),
  listener: new Error('Invalid listener; must be a function.'),
  target: new Error('Invalid target; must be a DOM node or evented object.')
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

QUnit.test('on(), one(), and race() errors', function(assert) {
  const targeta = this.targets.a = evented({});
  const targetb = this.targets.b = evented({});

  ['on', 'one', 'race'].forEach(method => {
    assert.throws(() => targeta[method](), errors.type, 'the expected error is thrown');
    assert.throws(() => targeta[method]('   '), errors.type, 'the expected error is thrown');
    assert.throws(() => targeta[method]([]), errors.type, 'the expected error is thrown');
    assert.throws(() => targeta[method]('x'), errors.listener, 'the expected error is thrown');
    assert.throws(() => targeta[method]({}, 'x', () => {}), errors.target, 'the expected error is thrown');
    assert.throws(() => targeta[method](targetb, 'x', null), errors.listener, 'the expected error is thrown');
  });
});

QUnit.test('off() errors', function(assert) {
  const targeta = this.targets.a = evented({});
  const targetb = this.targets.b = evented({});
  const targetc = this.targets.c = evented({});
  const targetd = this.targets.d = evented({});

  // An invalid event actually causes an invalid target error because it
  // gets passed into code that assumes the first argument is the target.
  assert.throws(() => targeta.off([]), errors.target, 'the expected error is thrown');
  assert.throws(() => targeta.off({}, 'x', () => {}), errors.target, 'the expected error is thrown');
  assert.throws(() => targeta.off(targetb, '', () => {}), errors.type, 'the expected error is thrown');
  assert.throws(() => targeta.off(targetc, [], () => {}), errors.type, 'the expected error is thrown');
  assert.throws(() => targeta.off(targetd, 'x', null), errors.listener, 'the expected error is thrown');
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

QUnit.test('race() can add a listener to one event type on this object', function(assert) {
  const a = this.targets.a = evented({});
  const spy = sinon.spy();

  a.race('x', spy);
  a.trigger('x');
  a.trigger('x');

  assert.strictEqual(spy.callCount, 1, 'the listener was called the expected number of times');

  validateListenerCall(spy.getCall(0), a, {
    type: 'x',
    target: a.eventBusEl_
  });
});

QUnit.test('race() can add a listener to an array of event types on this object', function(assert) {
  const a = this.targets.a = evented({});
  const spy = sinon.spy();

  a.race(['x', 'y'], spy);
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

QUnit.test('race() can add a listener to one event type on a different target object', function(assert) {
  const a = this.targets.a = evented({});
  const b = this.targets.b = evented({});
  const spy = sinon.spy();

  a.race(b, 'x', spy);
  b.trigger('x');

  // Make sure we aren't magically binding a listener to "a".
  a.trigger('x');

  assert.strictEqual(spy.callCount, 1, 'the listener was called the expected number of times');

  validateListenerCall(spy.getCall(0), a, {
    type: 'x',
    target: b.eventBusEl_
  });
});

QUnit.test('race() can add a listener to an array of event types on a different target object', function(assert) {
  const a = this.targets.a = evented({});
  const b = this.targets.b = evented({});
  const spy = sinon.spy();

  a.race(b, ['x', 'y'], spy);
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
