/* eslint-env qunit */
import sinon from 'sinon';
import evented from '../../../src/js/mixins/evented';
import stateful from '../../../src/js/mixins/stateful';
import * as Obj from '../../../src/js/utils/obj';

QUnit.module('mixins: stateful');

QUnit.test('stateful() mutates an object as expected', function(assert) {
  const target = {};

  assert.strictEqual(Object.prototype.toString.call(stateful), '[object Function]', 'the mixin is a function');
  assert.strictEqual(stateful(target), target, 'returns the target object');

  assert.ok(Obj.isObject(target), 'the target is still an object');
  assert.ok(Obj.isPlain(target.state), 'the target has a state');
  assert.strictEqual(Object.keys(target.state).length, 0, 'the target state is empty by default');
  assert.strictEqual(Object.prototype.toString.call(target.setState), '[object Function]', 'the target has a setState method');
});

QUnit.test('stateful() with default state passed in', function(assert) {
  const target = stateful({}, {foo: 'bar'});

  assert.strictEqual(target.state.foo, 'bar', 'the default properties are added to the state');
});

QUnit.test('stateful() without default state passed in', function(assert) {
  const target = stateful({});

  assert.strictEqual(Object.keys(target.state).length, 0, 'no default properties are added to the state');
});

QUnit.test('setState() works as expected', function(assert) {
  const target = stateful(evented({}), {foo: 'bar', abc: 'xyz'});
  const spy = sinon.spy();

  target.on('statechanged', spy);

  const next = {foo: null, boo: 123};
  const changes = target.setState(next);

  assert.deepEqual(changes, {
    foo: {from: 'bar', to: null},
    boo: {from: undefined, to: 123}
  }, 'setState returns changes, a plain object');

  assert.deepEqual(target.state, {
    abc: 'xyz',
    foo: null,
    boo: 123
  }, 'the state was updated as expected');

  assert.ok(spy.called, 'the "statechanged" event occurred');

  const event = spy.firstCall.args[0];

  assert.strictEqual(event.type, 'statechanged', 'the event had the expected type');
  assert.strictEqual(event.changes, changes, 'the changes object is sent along with the event');
});

QUnit.test('setState() without changes does not trigger the "statechanged" event', function(assert) {
  const target = stateful(evented({}), {foo: 'bar'});
  const spy = sinon.spy();

  target.on('statechanged', spy);

  const changes = target.setState({foo: 'bar'});

  assert.strictEqual(changes, undefined, 'no changes were returned');
  assert.strictEqual(spy.callCount, 0, 'no event was triggered');
});

QUnit.test('handleStateChanged() is automatically bound to "statechanged" event', function(assert) {
  const target = evented({});

  target.handleStateChanged = sinon.spy();
  stateful(target, {foo: 'bar'});

  const changes = target.setState({foo: true});

  assert.ok(target.handleStateChanged.called, 'the "statechanged" event occurred');

  const event = target.handleStateChanged.firstCall.args[0];

  assert.strictEqual(event.type, 'statechanged', 'the event had the expected type');
  assert.strictEqual(event.changes, changes, 'the handleStateChanged() method was called');
});
