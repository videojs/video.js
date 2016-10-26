/* eslint-env qunit */
import sinon from 'sinon';
import Player from '../../src/js/player';
import Plugin from '../../src/js/plugin';
import TestHelpers from './test-helpers';

class MockPlugin extends Plugin {}

MockPlugin.VERSION = 'v1.2.3';

QUnit.module('Plugin: static methods', {

  beforeEach() {
    this.basic = () => {};

    Plugin.registerPlugins({
      basic: this.basic,
      mock: MockPlugin
    });
  },

  afterEach() {
    Plugin.deregisterPlugins();
  }
});

QUnit.test('registerPlugin()', function(assert) {
  const foo = () => {};

  assert.strictEqual(Plugin.registerPlugin('foo', foo), foo);
  assert.strictEqual(Plugin.getPlugin('foo'), foo);
  assert.strictEqual(typeof Player.prototype.foo, 'function');
  assert.notStrictEqual(Player.prototype.foo, foo, 'the function on the player prototype is a wrapper');
});

QUnit.test('registerPlugin() illegal arguments', function(assert) {
  assert.throws(
    () => Plugin.registerPlugin(),
    new Error('illegal plugin name, "undefined"'),
    'plugins must have a name'
  );

  assert.throws(
    () => Plugin.registerPlugin('play'),
    new Error('illegal plugin name, "play"'),
    'plugins cannot share a name with an existing player method'
  );

  assert.throws(
    () => Plugin.registerPlugin('foo'),
    new Error('illegal plugin for "foo", must be a function, was undefined'),
    'plugins require both arguments'
  );

  assert.throws(
    () => Plugin.registerPlugin('foo', {}),
    new Error('illegal plugin for "foo", must be a function, was object'),
    'plugins must be functions'
  );
});

QUnit.test('registerPlugins()', function(assert) {
  const foo = () => {};
  const bar = () => {};

  Plugin.registerPlugins({bar, foo});

  assert.strictEqual(Plugin.getPlugin('foo'), foo);
  assert.strictEqual(Plugin.getPlugin('bar'), bar);
});

QUnit.test('getPlugin()', function(assert) {
  assert.ok(Plugin.getPlugin('basic'));
  assert.ok(Plugin.getPlugin('mock'));
  assert.strictEqual(Plugin.getPlugin(), undefined);
  assert.strictEqual(Plugin.getPlugin('nonExistent'), undefined);
  assert.strictEqual(Plugin.getPlugin(123), undefined);
});

QUnit.test('getPluginVersion()', function(assert) {
  assert.strictEqual(Plugin.getPluginVersion('basic'), '', 'the basic plugin has no version');
  assert.strictEqual(Plugin.getPluginVersion('mock'), 'v1.2.3');
});

QUnit.test('getPlugins()', function(assert) {
  assert.strictEqual(Object.keys(Plugin.getPlugins()).length, 2);
  assert.strictEqual(Plugin.getPlugins().basic, this.basic);
  assert.strictEqual(Plugin.getPlugins().mock, MockPlugin);
  assert.strictEqual(Object.keys(Plugin.getPlugins(['basic'])).length, 1);
  assert.strictEqual(Plugin.getPlugins(['basic']).basic, this.basic);
});

QUnit.test('deregisterPlugin()', function(assert) {
  const foo = () => {};

  Plugin.registerPlugin('foo', foo);
  Plugin.deregisterPlugin('foo');

  assert.strictEqual(Player.prototype.foo, undefined);
  assert.strictEqual(Plugin.getPlugin('foo'), undefined);
});

QUnit.test('deregisterPlugins()', function(assert) {
  const foo = () => {};
  const bar = () => {};

  Plugin.registerPlugins({bar, foo});
  Plugin.deregisterPlugins(['bar']);

  assert.strictEqual(Plugin.getPlugin('foo'), foo);
  assert.strictEqual(Plugin.getPlugin('bar'), undefined);

  Plugin.deregisterPlugins();
  assert.strictEqual(Plugin.getPlugin('foo'), undefined);
});

QUnit.test('isBasic()', function(assert) {
  assert.ok(Plugin.isBasic(this.basic));
  assert.ok(Plugin.isBasic('basic'));
  assert.ok(!Plugin.isBasic(MockPlugin));
  assert.ok(!Plugin.isBasic('mock'));
});

QUnit.module('Plugin: basic', {

  beforeEach() {
    this.basic = sinon.spy();
    this.player = TestHelpers.makePlayer();

    Plugin.registerPlugin('basic', this.basic);
  },

  afterEach() {
    this.player.dispose();
    Plugin.deregisterPlugins();
  }
});

QUnit.test('pre-setup interface', function(assert) {
  assert.strictEqual(typeof this.player.basic, 'function', 'basic plugins are a function on a player');
  assert.notStrictEqual(this.player.basic, this.basic, 'basic plugins are wrapped');
  assert.strictEqual(this.player.basic.dispose, undefined, 'unlike class-based plugins, basic plugins do not have a dispose method');
  assert.ok(!this.player.usingPlugin('basic'));
});

QUnit.test('setup', function(assert) {
  this.player.basic({foo: 'bar'}, 123);

  assert.strictEqual(this.basic.callCount, 1, 'the plugin was called once');
  assert.strictEqual(this.basic.firstCall.thisValue, this.player, 'the plugin `this` value was the player');
  assert.deepEqual(this.basic.firstCall.args, [{foo: 'bar'}, 123], 'the plugin had the correct arguments');
  assert.ok(this.player.usingPlugin('basic'), 'the player now recognizes that the plugin was set up');
});

QUnit.test('"pluginsetup" event', function(assert) {
  const setupSpy = sinon.spy();

  this.player.on('pluginsetup', setupSpy);
  const instance = this.player.basic();

  assert.strictEqual(setupSpy.callCount, 1, 'the "pluginsetup" event was triggered');

  const event = setupSpy.firstCall.args[0];
  const hash = setupSpy.firstCall.args[1];

  assert.strictEqual(event.type, 'pluginsetup', 'the event has the correct type');
  assert.deepEqual(hash, {
    name: 'basic',
    instance,
    plugin: this.basic
  }, 'the event hash object is correct');
});

QUnit.module('Plugin: class-based', {

  beforeEach() {
    this.player = TestHelpers.makePlayer();
    Plugin.registerPlugin('mock', MockPlugin);
  },

  afterEach() {
    this.player.dispose();
    Plugin.deregisterPlugins();
  }
});

QUnit.test('pre-activation interface', function(assert) {
  assert.strictEqual(typeof this.player.mock, 'function', 'plugins are a factory function on a player');
  assert.strictEqual(this.player.mock.dispose, undefined, 'class-based plugins are not populated on a player until the factory method creates them');
  assert.ok(!this.player.usingPlugin('mock'));
});
