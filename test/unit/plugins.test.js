import {IE_VERSION} from '../../src/js/utils/browser';
import registerPlugin from '../../src/js/plugins.js';
import Player from '../../src/js/player.js';
import TestHelpers from './test-helpers.js';
import window from 'global/window';

q.module('Plugins');

test('Plugin should get initialized and receive options', function(){
  expect(2);

  registerPlugin('myPlugin1', function(options){
    ok(true, 'Plugin initialized');
    ok(options['test'], 'Option passed through');
  });

  registerPlugin('myPlugin2', function(options){
    ok(false, 'Plugin initialized and should not have been');
  });

  var player = TestHelpers.makePlayer({
    'plugins': {
      'myPlugin1': {
        'test': true
      }
    }
  });

  player.dispose();
});

test('Plugin should have the option of being initilized outside of player init', function(){
  expect(3);

  registerPlugin('myPlugin3', function(options){
    ok(true, 'Plugin initialized after player init');
    ok(options['test'], 'Option passed through');
  });

  var player = TestHelpers.makePlayer({});

  ok(player['myPlugin3'], 'Plugin has direct access on player instance');

  player['myPlugin3']({
    'test': true
  });

  player.dispose();
});

test('Plugin should be able to add a UI component', function(){
  expect(2);

  registerPlugin('myPlugin4', function(options){
    ok((this instanceof Player), 'Plugin executed in player scope by default');
    this.addChild('component');
  });

  var player = TestHelpers.makePlayer({});
  player['myPlugin4']({
    'test': true
  });

  var comp = player.getChild('component');
  ok(comp, 'Plugin added a component to the player');

  player.dispose();
});

test('Plugin should overwrite plugin of same name', function(){
  var v1Called = 0,
      v2Called = 0,
      v3Called = 0;

  // Create initial plugin
  registerPlugin('myPlugin5', function(options){
    v1Called++;
  });
  var player = TestHelpers.makePlayer({});
  player['myPlugin5']({});

  // Overwrite and create new player
  registerPlugin('myPlugin5', function(options){
    v2Called++;
  });
  var player2 = TestHelpers.makePlayer({});
  player2['myPlugin5']({});

  // Overwrite and init new version on existing player
  registerPlugin('myPlugin5', function(options){
    v3Called++;
  });
  player2['myPlugin5']({});

  var comp = player.getChild('component');
  ok(v1Called === 1, 'First version of plugin called once');
  ok(v2Called === 1, 'Plugin overwritten for new player');
  ok(v3Called === 1, 'Plugin overwritten for existing player');

  player.dispose();
  player2.dispose();
});


test('Plugins should get events in registration order', function() {
  var order = [];
  var expectedOrder = [];
  var pluginName = 'orderPlugin';
  var i = 0;
  var name;
  var player = TestHelpers.makePlayer({});
  var plugin = function (name) {
    registerPlugin(name, function (opts) {
      this.on('test', function (event) {
        order.push(name);
      });
    });
    player[name]({});
  };

  for (; i < 3; i++ ) {
    name = pluginName + i;
    expectedOrder.push(name);
    plugin(name);
  }

  registerPlugin('testerPlugin', function (opts) {
    this.trigger('test');
  });

  player['testerPlugin']({});

  deepEqual(order, expectedOrder, 'plugins should receive events in order of initialization');
  player.dispose();
});

test('Plugins should not get events after stopImmediatePropagation is called', function () {
  var order = [];
  var expectedOrder = [];
  var pluginName = 'orderPlugin';
  var i = 0;
  var name;
  var player = TestHelpers.makePlayer({});
  var plugin = function (name) {
    registerPlugin(name, function (opts) {
      this.on('test', function (event) {
        order.push(name);
        event.stopImmediatePropagation();
      });
    });
    player[name]({});
  };

  for (; i < 3; i++ ) {
    name = pluginName + i;
    expectedOrder.push(name);
    plugin(name);
  }

  registerPlugin('testerPlugin', function (opts) {
    this.trigger('test');
  });

  player['testerPlugin']({});

  deepEqual(order, expectedOrder.slice(0, order.length), 'plugins should receive events in order of initialization, until stopImmediatePropagation');

  equal(order.length, 1, 'only one event listener should have triggered');
  player.dispose();
});

test('Plugin that does not exist logs an error', function() {

  // stub the global log functions
  var console, log, error, origConsole;

  origConsole = window.console;

  console = window.console = {
    log: function(){},
    warn: function(){},
    error: function(){}
  };

  log = sinon.stub(console, 'log');
  error = sinon.stub(console, 'error');

  // enable a non-existing plugin
  TestHelpers.makePlayer({
    plugins: {
      'nonExistingPlugin': {
        'foo': 'bar'
      }
    }
  });

  ok(error.called, 'error was called');

  if (IE_VERSION && IE_VERSION < 11) {
    equal(error.firstCall.args[0], 'VIDEOJS: ERROR: Unable to find plugin: nonExistingPlugin');
  } else {
    equal(error.firstCall.args[2], 'Unable to find plugin:');
    equal(error.firstCall.args[3], 'nonExistingPlugin');
  }

  // tear down logging stubs
  log.restore();
  error.restore();
  window.console = origConsole;
});
