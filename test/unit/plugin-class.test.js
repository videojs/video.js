/* eslint-env qunit */
import sinon from 'sinon';
import Plugin from '../../src/js/plugin';
import TestHelpers from './test-helpers';

class MockPlugin extends Plugin {}

MockPlugin.VERSION = 'v1.2.3';

QUnit.module('Plugin: class-based', {

  beforeEach() {
    this.derp = sinon.spy();
    this.player = TestHelpers.makePlayer();
    Plugin.registerPlugin('mock', MockPlugin);
  },

  afterEach() {
    this.player.dispose();
    Plugin.deregisterPlugins();
  }
});

QUnit.test('pre-activation interface', function(assert) {
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
