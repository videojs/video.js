import videojs from '../../src/js/video.js';
import TestHelpers from './test-helpers.js';

q.module('video.js');

test('should expose plugin registry function', function() {
  var pluginName, pluginFunction, player;

  pluginName = 'foo';
  pluginFunction = function(options) {
    console.log(this);
  };

  ok(videojs.plugin, 'should exist');

  videojs.plugin(pluginName, pluginFunction);

  player = TestHelpers.makePlayer();

  ok(player.foo, 'should exist');
  equal(player.foo, pluginFunction, 'should be equal');

});
