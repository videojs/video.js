/* eslint-env qunit */
import sinon from 'sinon';
import eventful from '../../../src/js/mixins/eventful';
import * as Dom from '../../../src/js/utils/dom';
import * as Obj from '../../../src/js/utils/obj';

QUnit.module('mixins: eventful');

QUnit.test('eventful() mutations', function(assert) {
  const target = {};

  assert.strictEqual(typeof eventful, 'function', 'the mixin is a function');
  assert.strictEqual(eventful(target), target, 'returns the target object');

  assert.ok(Obj.isObject(target), 'the target is still an object');
  assert.ok(Dom.isEl(target.eventBusEl_), 'the target has an event bus element');
  assert.strictEqual(typeof target.off, 'function', 'the target has an off method');
  assert.strictEqual(typeof target.on, 'function', 'the target has an on method');
  assert.strictEqual(typeof target.one, 'function', 'the target has a one method');
  assert.strictEqual(typeof target.trigger, 'function', 'the target has a trigger method');
});

QUnit.test('eventful() with exclusions', function(assert) {
  const target = eventful({}, ['one']);

  assert.strictEqual(typeof target.off, 'function', 'the target has an off method');
  assert.strictEqual(typeof target.on, 'function', 'the target has an on method');
  assert.notStrictEqual(typeof target.one, 'function', 'the target DOES NOT have a one method');
  assert.strictEqual(typeof target.trigger, 'function', 'the target has a trigger method');
});

QUnit.test('supports basic event handling (not complete functionality tests)', function(assert) {
  const spy = sinon.spy();
  const target = eventful({});

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
