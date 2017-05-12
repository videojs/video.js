/* eslint-env qunit */
import sinon from 'sinon';
import Plugin from '../../src/js/plugin';
import TestHelpers from './test-helpers';

QUnit.module('Plugin: basic', {

  beforeEach() {
    this.basic = sinon.spy();
    this.player = TestHelpers.makePlayer();

    Plugin.registerPlugin('basic', this.basic);
  },

  afterEach() {
    this.player.dispose();

    Object.keys(Plugin.getPlugins()).forEach(key => {
      if (key !== Plugin.BASE_PLUGIN_NAME) {
        Plugin.deregisterPlugin(key);
      }
    });
  }
});

QUnit.test('pre-setup interface', function(assert) {
  assert.strictEqual(typeof this.player.basic, 'function', 'basic plugins are a function on a player');
  assert.ok(this.player.hasPlugin('basic'), 'player has the plugin available');
  assert.notStrictEqual(this.player.basic, this.basic, 'basic plugins are wrapped');
  assert.strictEqual(this.player.basic.dispose, undefined, 'unlike advanced plugins, basic plugins do not have a dispose method');
  assert.notOk(this.player.usingPlugin('basic'), 'the player is not using the plugin');
});

QUnit.test('setup', function(assert) {
  this.player.basic({foo: 'bar'}, 123);
  assert.strictEqual(this.basic.callCount, 1, 'the plugin was called once');
  assert.strictEqual(this.basic.firstCall.thisValue, this.player, 'the plugin `this` value was the player');
  assert.deepEqual(this.basic.firstCall.args, [{foo: 'bar'}, 123], 'the plugin had the correct arguments');
  assert.ok(this.player.usingPlugin('basic'), 'the player now recognizes that the plugin was set up');
  assert.ok(this.player.hasPlugin('basic'), 'player has the plugin available');

  this.player.basic({foo: 'bar'}, 123);
  assert.strictEqual(this.basic.callCount, 2, 'the plugin was called twice');
  assert.strictEqual(this.basic.firstCall.thisValue, this.player, 'the plugin `this` value was the player');
  assert.deepEqual(this.basic.firstCall.args, [{foo: 'bar'}, 123], 'the plugin had the correct arguments');
  assert.ok(this.player.usingPlugin('basic'), 'the player now recognizes that the plugin was set up');
  assert.ok(this.player.hasPlugin('basic'), 'player has the plugin available');
});

QUnit.test('all "pluginsetup" events', function(assert) {
  const setupSpy = sinon.spy();
  const events = [
    'beforepluginsetup',
    'beforepluginsetup:basic',
    'pluginsetup',
    'pluginsetup:basic'
  ];

  this.player.on(events, setupSpy);

  const instance = this.player.basic();

  events.forEach((type, i) => {
    const event = setupSpy.getCall(i).args[0];
    const hash = setupSpy.getCall(i).args[1];

    assert.strictEqual(event.type, type, `the "${type}" event was triggered`);
    assert.strictEqual(event.target, this.player.el_, 'the event has the correct target');

    assert.deepEqual(hash, {
      name: 'basic',

      // The "before" events have a `null` instance and the others have the
      // return value of the plugin factory.
      instance: i < 2 ? null : instance,
      plugin: this.basic
    }, 'the event hash object is correct');
  });
});

QUnit.test('properties are copied', function(assert) {
  const foo = () => {};

  foo.someProp = () => {};
  foo.VERSION = '9.9.9';

  Plugin.registerPlugin('foo', foo);

  assert.strictEqual(this.player.foo.VERSION, foo.VERSION, 'properties are copied');
  assert.strictEqual(this.player.foo.someProp, foo.someProp, 'properties are copied');

  this.player.foo();

  assert.strictEqual(this.player.foo.VERSION, foo.VERSION, 'properties still exist after init');
  assert.strictEqual(this.player.foo.someProp, foo.someProp, 'properties still exist after init');
});
