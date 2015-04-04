import TestHelpers from './test-helpers.js';

q.module('Setup');

test('should set options from data-setup even if autoSetup is not called before initialisation', function(){
  var el = TestHelpers.makeTag();
  el.setAttribute('data-setup', '{"controls": true, "autoplay": false, "preload": "auto"}');

  var player = TestHelpers.makePlayer({}, el);

  ok(player.options_['controls'] === true);
  ok(player.options_['autoplay'] === false);
  ok(player.options_['preload'] === 'auto');
});
