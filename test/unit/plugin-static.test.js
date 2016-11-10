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
    Plugin.deregisterPlugin('basic');
    Plugin.deregisterPlugin('mock');
  }
});

QUnit.test('registerPlugin()', function(assert) {
  const foo = () => {};

  assert.strictEqual(Plugin.registerPlugin('foo', foo), foo);
  assert.strictEqual(Plugin.getPlugin('foo'), foo);
  assert.strictEqual(typeof Player.prototype.foo, 'function');

  assert.notStrictEqual(
    Player.prototype.foo,
    foo,
    'the function on the player prototype is a wrapper'
  );

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
  assert.ok(Plugin.getPlugin('basic'));
  assert.ok(Plugin.getPlugin('mock'));
  assert.strictEqual(Plugin.getPlugin(), undefined);
  assert.strictEqual(Plugin.getPlugin('nonExistent'), undefined);
  assert.strictEqual(Plugin.getPlugin(123), undefined);
});

QUnit.test('getPluginVersion()', function(assert) {
  assert.strictEqual(
    Plugin.getPluginVersion('basic'),
    '',
    'the basic plugin has no version'
  );

  assert.strictEqual(Plugin.getPluginVersion('mock'), 'v1.2.3');
});

QUnit.test('getPlugins()', function(assert) {
  assert.strictEqual(Object.keys(Plugin.getPlugins()).length, 3);
  assert.strictEqual(Plugin.getPlugins().basic, this.basic);
  assert.strictEqual(Plugin.getPlugins().mock, MockPlugin);
  assert.strictEqual(Plugin.getPlugins().plugin, Plugin);
  assert.strictEqual(Object.keys(Plugin.getPlugins(['basic'])).length, 1);
  assert.strictEqual(Plugin.getPlugins(['basic']).basic, this.basic);
});

QUnit.test('deregisterPlugin()', function(assert) {
  const foo = () => {};

  Plugin.registerPlugin('foo', foo);
  Plugin.deregisterPlugin('foo');

  assert.strictEqual(Player.prototype.foo, undefined);
  assert.strictEqual(Plugin.getPlugin('foo'), undefined);

  assert.throws(
    () => Plugin.deregisterPlugin('plugin'),
    new Error('cannot de-register base plugin'),
  );
});

QUnit.test('isBasic()', function(assert) {
  assert.ok(Plugin.isBasic(this.basic));
  assert.ok(Plugin.isBasic('basic'));
  assert.notOk(Plugin.isBasic(MockPlugin));
  assert.notOk(Plugin.isBasic('mock'));
});
