/* eslint-env qunit */
import sinon from 'sinon';
import evented from '../../../src/js/mixins/evented';
import * as Dom from '../../../src/js/utils/dom';
import * as Obj from '../../../src/js/utils/obj';

QUnit.module('mixins: evented');

QUnit.test('evented() mutations', function(assert) {
  const target = {};

  assert.strictEqual(typeof evented, 'function', 'the mixin is a function');
  assert.strictEqual(evented(target), target, 'returns the target object');

  assert.ok(Obj.isObject(target), 'the target is still an object');
  assert.ok(Dom.isEl(target.eventBusEl_), 'the target has an event bus element');
  assert.strictEqual(typeof target.off, 'function', 'the target has an off method');
  assert.strictEqual(typeof target.on, 'function', 'the target has an on method');
  assert.strictEqual(typeof target.one, 'function', 'the target has a one method');
  assert.strictEqual(typeof target.trigger, 'function', 'the target has a trigger method');
});

QUnit.test('evented() with exclusions', function(assert) {
  const target = evented({}, {exclude: ['one']});

  assert.strictEqual(typeof target.off, 'function', 'the target has an off method');
  assert.strictEqual(typeof target.on, 'function', 'the target has an on method');
  assert.notStrictEqual(typeof target.one, 'function', 'the target DOES NOT have a one method');
  assert.strictEqual(typeof target.trigger, 'function', 'the target has a trigger method');
});

QUnit.test('evented() with custom element', function(assert) {
  const target = evented({foo: Dom.createEl('span')}, {eventBusKey: 'foo'});

  assert.strictEqual(target.eventBusEl_, target.foo, 'the custom DOM element is re-used');

  assert.throws(
    function() {
      evented({foo: {}}, {eventBusKey: 'foo'});
    },
    new Error('eventBusKey "foo" does not refer to an element'),
    'throws if the target does not have an element at the supplied key');
});

QUnit.test('supports basic event handling (not complete functionality tests)', function(assert) {
  const spy = sinon.spy();
  const target = evented({});

  target.on('foo', spy);
  target.trigger('foo', {x: 1});
  target.off('foo');
  target.trigger('foo');

  assert.strictEqual(spy.callCount, 1, 'the spy was called once');

  const event = spy.firstCall.args[0];
  const hash = spy.firstCall.args[1];

  assert.strictEqual(event.type, 'foo', 'the spy saw a "foo" event');
  assert.strictEqual(hash.x, 1, 'the "foo" event included an extra hash');
});

QUnit.test('target objects add listeners for events on themselves', function(assert) {
  assert.expect(0);
});

QUnit.test('target objects add listeners that only fire once for events on themselves', function(assert) {
  assert.expect(0);
});

QUnit.test('target objects add listeners for events on themselves - and remove them when disposed', function(assert) {
  assert.expect(0);
});

QUnit.test('target objects add listeners for events on other evented objects', function(assert) {
  assert.expect(0);
});

QUnit.test('target objects add listeners that only fire once for events on other evented objects', function(assert) {
  assert.expect(0);
});

QUnit.test('target objects add listeners for events on other evented objects - and remove them when disposed', function(assert) {
  assert.expect(0);
});

