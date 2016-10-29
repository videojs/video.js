/* eslint-env qunit */
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

QUnit.test('on() errors', function(assert) {
  assert.expect(0);
});

QUnit.test('one() errors', function(assert) {
  assert.expect(0);
});

QUnit.test('off() errors', function(assert) {
  assert.expect(0);
});

QUnit.test('a.on("x", fn)', function(assert) {
  assert.expect(0);
});

QUnit.test('a.on(["x", "y"], fn)', function(assert) {
  assert.expect(0);
});

QUnit.test('a.one("x", fn)', function(assert) {
  assert.expect(0);
});

QUnit.test('a.one(["x", "y"], fn)', function(assert) {
  assert.expect(0);
});

QUnit.test('a.on(b, "x", fn)', function(assert) {
  assert.expect(0);
});

QUnit.test('a.on(b, ["x", "y"], fn)', function(assert) {
  assert.expect(0);
});

QUnit.test('a.one(b, "x", fn)', function(assert) {
  assert.expect(0);
});

QUnit.test('a.one(b, ["x", "y"], fn)', function(assert) {
  assert.expect(0);
});

QUnit.test('a.off()', function(assert) {
  assert.expect(0);
});

QUnit.test('a.off("x")', function(assert) {
  assert.expect(0);
});

QUnit.test('a.off("x", fn)', function(assert) {
  assert.expect(0);
});

QUnit.test('a.off(b, "x", fn)', function(assert) {
  assert.expect(0);
});
