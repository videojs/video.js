/* eslint-env qunit */
import {IE_VERSION} from '../../src/js/utils/browser';
import registerPlugin from '../../src/js/plugins.js';
import Player from '../../src/js/player.js';
import TestHelpers from './test-helpers.js';
import window from 'global/window';
import sinon from 'sinon';

QUnit.module('Plugins');

QUnit.test('Plugin should get initialized and receive options', function(assert) {
  assert.expect(2);

  registerPlugin('myPlugin1', function(options) {
    assert.ok(true, 'Plugin initialized');
    assert.ok(options.test, 'Option passed through');
  });

  registerPlugin('myPlugin2', function(options) {
    assert.ok(false, 'Plugin initialized and should not have been');
  });

  const player = TestHelpers.makePlayer({
    plugins: {
      myPlugin1: {
        test: true
      }
    }
  });

  player.dispose();
});

QUnit.test('Plugin should have the option of being initilized outside of player init', function(assert) {
  assert.expect(3);

  registerPlugin('myPlugin3', function(options) {
    assert.ok(true, 'Plugin initialized after player init');
    assert.ok(options.test, 'Option passed through');
  });

  const player = TestHelpers.makePlayer({});

  assert.ok(player.myPlugin3, 'Plugin has direct access on player instance');

  player.myPlugin3({
    test: true
  });

  player.dispose();
});

QUnit.test('Plugin should be able to add a UI component', function(assert) {
  assert.expect(2);

  registerPlugin('myPlugin4', function(options) {
    assert.ok((this instanceof Player), 'Plugin executed in player scope by default');
    this.addChild('component');
  });

  const player = TestHelpers.makePlayer({});

  player.myPlugin4({
    test: true
  });

  const comp = player.getChild('component');

  assert.ok(comp, 'Plugin added a component to the player');

  player.dispose();
});

QUnit.test('Plugin should overwrite plugin of same name', function(assert) {
  let v1Called = 0;
  let v2Called = 0;
  let v3Called = 0;

  // Create initial plugin
  registerPlugin('myPlugin5', function(options) {
    v1Called++;
  });
  const player = TestHelpers.makePlayer({});

  player.myPlugin5({});

  // Overwrite and create new player
  registerPlugin('myPlugin5', function(options) {
    v2Called++;
  });
  const player2 = TestHelpers.makePlayer({});

  player2.myPlugin5({});

  // Overwrite and init new version on existing player
  registerPlugin('myPlugin5', function(options) {
    v3Called++;
  });
  player2.myPlugin5({});

  assert.ok(v1Called === 1, 'First version of plugin called once');
  assert.ok(v2Called === 1, 'Plugin overwritten for new player');
  assert.ok(v3Called === 1, 'Plugin overwritten for existing player');

  player.dispose();
  player2.dispose();
});

QUnit.test('Plugins should get events in registration order', function(assert) {
  const order = [];
  const expectedOrder = [];
  const pluginName = 'orderPlugin';
  const player = TestHelpers.makePlayer({});
  const plugin = function(name) {
    registerPlugin(name, function(opts) {
      this.on('test', function(event) {
        order.push(name);
      });
    });
    player[name]({});
  };

  for (let i = 0; i < 3; i++) {
    const name = pluginName + i;

    expectedOrder.push(name);
    plugin(name);
  }

  registerPlugin('testerPlugin', function(opts) {
    this.trigger('test');
  });

  player.testerPlugin({});

  assert.deepEqual(order,
            expectedOrder,
            'plugins should receive events in order of initialization');
  player.dispose();
});

QUnit.test('Plugins should not get events after stopImmediatePropagation is called', function(assert) {
  const order = [];
  const expectedOrder = [];
  const pluginName = 'orderPlugin';
  const player = TestHelpers.makePlayer({});
  const plugin = function(name) {
    registerPlugin(name, function(opts) {
      this.on('test', function(event) {
        order.push(name);
        event.stopImmediatePropagation();
      });
    });
    player[name]({});
  };

  for (let i = 0; i < 3; i++) {
    const name = pluginName + i;

    expectedOrder.push(name);
    plugin(name);
  }

  registerPlugin('testerPlugin', function(opts) {
    this.trigger('test');
  });

  player.testerPlugin({});

  assert.deepEqual(order,
            expectedOrder.slice(0, order.length),
            'plugins should receive events in order of ' +
            'initialization, until stopImmediatePropagation');

  assert.equal(order.length, 1, 'only one event listener should have triggered');
  player.dispose();
});

QUnit.test('Plugin that does not exist logs an error', function(assert) {

  // stub the global log functions
  const console = window.console = {
    log() {},
    warn() {},
    error() {}
  };
  const log = sinon.stub(console, 'log');
  const error = sinon.stub(console, 'error');
  const origConsole = window.console;

  // enable a non-existing plugin
  TestHelpers.makePlayer({
    plugins: {
      nonExistingPlugin: {
        foo: 'bar'
      }
    }
  });

  assert.ok(error.called, 'error was called');

  if (IE_VERSION && IE_VERSION < 11) {
    assert.equal(error.firstCall.args[0],
                'VIDEOJS: ERROR: Unable to find plugin: nonExistingPlugin');
  } else {
    assert.equal(error.firstCall.args[2], 'Unable to find plugin:');
    assert.equal(error.firstCall.args[3], 'nonExistingPlugin');
  }

  // tear down logging stubs
  log.restore();
  error.restore();
  window.console = origConsole;
});
