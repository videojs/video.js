/* eslint-env qunit */
import Player from '../../src/js/player';
import Plugin from '../../src/js/plugin';

class MockPlugin extends Plugin {}

MockPlugin.VERSION = 'v1.2.3';

const basicPlugin = () => {};

QUnit.module('Plugin', {

  beforeEach() {
    Plugin.registerPlugins({
      basicPlugin,
      mockPlugin: MockPlugin
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
  assert.ok(Plugin.getPlugin('basicPlugin'));
  assert.ok(Plugin.getPlugin('mockPlugin'));
  assert.strictEqual(Plugin.getPlugin(), undefined);
  assert.strictEqual(Plugin.getPlugin('nonExistent'), undefined);
  assert.strictEqual(Plugin.getPlugin(123), undefined);
});

QUnit.test('getPluginVersion()', function(assert) {
  assert.strictEqual(Plugin.getPluginVersion('basicPlugin'), '', 'the basic plugin has no version');
  assert.strictEqual(Plugin.getPluginVersion('mockPlugin'), 'v1.2.3');
});

QUnit.test('getPlugins()', function(assert) {
  assert.strictEqual(Object.keys(Plugin.getPlugins()).length, 2);
  assert.strictEqual(Plugin.getPlugins().basicPlugin, basicPlugin);
  assert.strictEqual(Plugin.getPlugins().mockPlugin, MockPlugin);
  assert.strictEqual(Object.keys(Plugin.getPlugins(['basicPlugin'])).length, 1);
  assert.strictEqual(Plugin.getPlugins(['basicPlugin']).basicPlugin, basicPlugin);
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
  assert.ok(Plugin.isBasic(basicPlugin));
  assert.ok(Plugin.isBasic('basicPlugin'));
  assert.ok(!Plugin.isBasic(MockPlugin));
  assert.ok(!Plugin.isBasic('mockPlugin'));
});
