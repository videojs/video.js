/* eslint-env qunit */
import Player from '../../src/js/player';
import Plugin from '../../src/js/plugin';

class MockPlugin extends Plugin {}

MockPlugin.VERSION = 'v1.2.3';

QUnit.module('Plugin: static methods', {

  beforeEach() {
    this.basic = () => {};

    Plugin.registerPlugin('basic', this.basic);
    Plugin.registerPlugin('mock', MockPlugin);
  },

  afterEach() {
    Object.keys(Plugin.getPlugins()).forEach(key => {
      if (key !== Plugin.BASE_PLUGIN_NAME) {
        Plugin.deregisterPlugin(key);
      }
    });
  }
});

QUnit.test('registerPlugin() works with basic plugins', function(assert) {
  const foo = () => {};

  assert.strictEqual(Plugin.registerPlugin('foo', foo), foo, 'the plugin is returned');
  assert.strictEqual(Plugin.getPlugin('foo'), foo, 'the plugin can be retrieved');
  assert.strictEqual(typeof Player.prototype.foo, 'function', 'the plugin has a wrapper function');
  assert.notStrictEqual(Player.prototype.foo, foo, 'the function on the player prototype is a wrapper');

  Plugin.deregisterPlugin('foo');
});

QUnit.test('registerPlugin() works with class-based plugins', function(assert) {
  class Foo extends Plugin {}

  assert.strictEqual(Plugin.registerPlugin('foo', Foo), Foo, 'the plugin is returned');
  assert.strictEqual(Plugin.getPlugin('foo'), Foo, 'the plugin can be retrieved');
  assert.strictEqual(typeof Player.prototype.foo, 'function', 'the plugin has a factory function');
  assert.notStrictEqual(Player.prototype.foo, Foo, 'the function on the player prototype is a factory');

  Plugin.deregisterPlugin('foo');
});

QUnit.test('registerPlugin() illegal arguments', function(assert) {
  assert.throws(
    () => Plugin.registerPlugin(),
    new Error('illegal plugin name, "undefined", must be a string, was undefined'),
    'plugins must have a name'
  );

  assert.throws(
    () => Plugin.registerPlugin('play'),
    new Error('illegal plugin name, "play", already exists'),
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

QUnit.test('getPlugin()', function(assert) {
  assert.ok(Plugin.getPlugin('basic'), 'the "basic" plugin exists');
  assert.ok(Plugin.getPlugin('mock'), 'the "mock" plugin exists');
  assert.strictEqual(Plugin.getPlugin(), undefined, 'returns undefined with no arguments');
  assert.strictEqual(Plugin.getPlugin('nonExistent'), undefined, 'returns undefined with non-existent plugin');
  assert.strictEqual(Plugin.getPlugin(123), undefined, 'returns undefined with an invalid type');
});

QUnit.test('getPluginVersion()', function(assert) {
  assert.strictEqual(Plugin.getPluginVersion('basic'), '', 'the basic plugin has no version');
  assert.strictEqual(Plugin.getPluginVersion('mock'), 'v1.2.3', 'a plugin with a version returns its version');
});

QUnit.test('getPlugins()', function(assert) {
  assert.strictEqual(Object.keys(Plugin.getPlugins()).length, 3, 'all plugins are returned by default');
  assert.strictEqual(Plugin.getPlugins().basic, this.basic, 'the "basic" plugin is included');
  assert.strictEqual(Plugin.getPlugins().mock, MockPlugin, 'the "mock" plugin is included');
  assert.strictEqual(Plugin.getPlugins().plugin, Plugin, 'the "plugin" plugin is included');
  assert.strictEqual(Object.keys(Plugin.getPlugins(['basic'])).length, 1, 'a subset of plugins can be requested');
  assert.strictEqual(Plugin.getPlugins(['basic']).basic, this.basic, 'the correct subset of plugins is returned');
});

QUnit.test('deregisterPlugin()', function(assert) {
  const foo = () => {};

  Plugin.registerPlugin('foo', foo);
  Plugin.deregisterPlugin('foo');

  assert.strictEqual(Player.prototype.foo, undefined, 'the player prototype method is removed');
  assert.strictEqual(Plugin.getPlugin('foo'), undefined, 'the plugin can no longer be retrieved');

  assert.throws(
    () => Plugin.deregisterPlugin('plugin'),
    new Error('cannot de-register base plugin'),
    'the base plugin cannot be de-registered'
  );
});

QUnit.test('isBasic()', function(assert) {
  assert.ok(Plugin.isBasic(this.basic), 'the "basic" plugin is a basic plugin (by reference)');
  assert.ok(Plugin.isBasic('basic'), 'the "basic" plugin is a basic plugin (by name)');
  assert.notOk(Plugin.isBasic(MockPlugin), 'the "mock" plugin is NOT a basic plugin (by reference)');
  assert.notOk(Plugin.isBasic('mock'), 'the "mock" plugin is NOT a basic plugin (by name)');
});
