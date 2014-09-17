module('Setup');

test('should set options from data-setup even if autoSetup is not called before initialisation', function(){
  var fixture = document.getElementById('qunit-fixture');

  var html = '<video id="example_1" class="video-js" data-setup="{&quot;controls&quot;: true, &quot;autoplay&quot;: false, &quot;preload&quot;: &quot;auto&quot; }">';
      html += '<source src="http://google.com" type="video/mp4">';
      html += '<source src="http://google.com" type="video/webm">';
      html += '</video>';

  fixture.innerHTML += html;

  var tag = document.getElementById('example_1');
  var player = vjs('example_1');

  ok(player.options_['controls'] === true);
  ok(player.options_['autoplay'] === false);
  ok(player.options_['preload'] === 'auto');
});
