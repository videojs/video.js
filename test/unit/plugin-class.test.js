/* eslint-env qunit */
import sinon from 'sinon';
import Plugin from '../../src/js/plugin';
import TestHelpers from './test-helpers';

QUnit.module('Plugin: class-based', {

  beforeEach() {
    this.player = TestHelpers.makePlayer();
    const spy = this.spy = sinon.spy();

    class MockPlugin extends Plugin {

      constructor(...args) {
        super(...args);
        spy.apply(this, args);
      }
    }

    this.MockPlugin = MockPlugin;
    Plugin.registerPlugin('mock', MockPlugin);
  },

  afterEach() {
    this.player.dispose();
    Plugin.deregisterPlugin('mock');
  }
});

QUnit.test('pre-setup interface', function(assert) {
  assert.strictEqual(
    typeof this.player.mock,
    'function',
    'plugins are a factory function on a player'
  );

  assert.strictEqual(
    this.player.mock.dispose,
    undefined,
    'class-based plugins are not populated on a player until the factory method creates them'
  );

  assert.ok(!this.player.usingPlugin('mock'));
});

QUnit.test('setup', function(assert) {
  const instance = this.player.mock({foo: 'bar'}, 123);

  assert.strictEqual(this.spy.callCount, 1, 'plugin was set up once');

  assert.strictEqual(
    this.spy.firstCall.thisValue,
    instance,
    'plugin constructor `this` value was the instance'
  );

  assert.deepEqual(
    this.spy.firstCall.args,
    [this.player, {foo: 'bar'}, 123],
    'plugin had the correct arguments'
  );

  assert.ok(
    this.player.usingPlugin('mock'),
    'player now recognizes that the plugin was set up'
  );

  assert.ok(
    instance instanceof this.MockPlugin,
    'plugin instance has the correct constructor'
  );

  assert.strictEqual(instance, this.player.mock, 'instance replaces the factory');

  assert.strictEqual(
    instance.player,
    this.player,
    'instance has a reference to the player'
  );

  assert.strictEqual(instance.name, 'mock', 'instance knows its name');
  assert.strictEqual(typeof instance.state, 'object', 'instance is stateful');
  assert.strictEqual(typeof instance.setState, 'function', 'instance is stateful');
  assert.strictEqual(typeof instance.off, 'function', 'instance is evented');
  assert.strictEqual(typeof instance.on, 'function', 'instance is evented');
  assert.strictEqual(typeof instance.one, 'function', 'instance is evented');
  assert.strictEqual(typeof instance.trigger, 'function', 'instance is evented');
  assert.strictEqual(typeof instance.dispose, 'function', 'instance has dispose method');
});

QUnit.test('"pluginsetup" event', function(assert) {
  const setupSpy = sinon.spy();

  this.player.on('pluginsetup', setupSpy);
  const instance = this.player.mock();

  assert.strictEqual(setupSpy.callCount, 1, 'the "pluginsetup" event was triggered');

  const event = setupSpy.firstCall.args[0];
  const hash = setupSpy.firstCall.args[1];

  assert.strictEqual(event.type, 'pluginsetup', 'the event has the correct type');

  assert.strictEqual(
    event.target,
    this.player.el_,
    'the event has the correct target'
  );

  assert.deepEqual(hash, {
    name: 'mock',
    instance,
    plugin: this.MockPlugin
  }, 'the event hash object is correct');
});

QUnit.test('defaultState static property is used to populate state', function(assert) {
  class DefaultStateMock extends Plugin {}
  DefaultStateMock.defaultState = {foo: 1, bar: 2};
  Plugin.registerPlugin('dsm', DefaultStateMock);

  const instance = this.player.dsm();

  assert.deepEqual(instance.state, {foo: 1, bar: 2});
  Plugin.deregisterPlugin('dsm');
});

QUnit.test('dispose', function(assert) {
  const instance = this.player.mock();

  instance.dispose();

  assert.ok(
    !this.player.usingPlugin('mock'),
    'player recognizes that the plugin is NOT set up'
  );

  assert.strictEqual(
    typeof this.player.mock,
    'function',
    'instance is replaced by factory'
  );

  assert.notStrictEqual(instance, this.player.mock, 'instance is replaced by factory');

  assert.strictEqual(
    instance.player,
    null,
    'instance no longer has a reference to the player'
  );

  assert.strictEqual(instance.state, null, 'state is now null');

  ['dispose', 'setState', 'off', 'on', 'one', 'trigger'].forEach(n => {
    assert.throws(
      function() {
        instance[n]();
      },
      new Error('cannot call methods on a disposed object'),
      `the "${n}" method now throws`
    );
  });
});

QUnit.test('"dispose" event', function(assert) {
  const disposeSpy = sinon.spy();
  const instance = this.player.mock();

  instance.on('dispose', disposeSpy);
  instance.dispose();

  assert.strictEqual(disposeSpy.callCount, 1, 'the "dispose" event was triggered');

  const event = disposeSpy.firstCall.args[0];
  const hash = disposeSpy.firstCall.args[1];

  assert.strictEqual(event.type, 'dispose', 'the event has the correct type');

  assert.strictEqual(
    event.target,
    instance.eventBusEl_,
    'the event has the correct target'
  );

  assert.deepEqual(hash, {
    name: 'mock',
    instance,
    plugin: this.MockPlugin
  }, 'the event hash object is correct');
});

QUnit.test('arbitrary events', function(assert) {
  const fooSpy = sinon.spy();
  const instance = this.player.mock();

  instance.on('foo', fooSpy);
  instance.trigger('foo');

  assert.strictEqual(fooSpy.callCount, 1, 'the "foo" event was triggered');

  const event = fooSpy.firstCall.args[0];
  const hash = fooSpy.firstCall.args[1];

  assert.strictEqual(event.type, 'foo', 'the event has the correct type');

  assert.strictEqual(
    event.target,
    instance.eventBusEl_,
    'the event has the correct target'
  );

  assert.deepEqual(hash, {
    name: 'mock',
    instance,
    plugin: this.MockPlugin
  }, 'the event hash object is correct');
});
