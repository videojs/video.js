module('Player Minified');

var PlayerTest = {
  makeTag: function(){
    var videoTag = document.createElement('video');
    videoTag.id = 'example_1';
    videoTag.className = 'video-js vjs-default-skin';
    return videoTag;
  }
};

test('should export ready api call to public', function() {
  var videoTag = PlayerTest.makeTag();

  var fixture = document.getElementById('qunit-fixture');
  fixture.appendChild(videoTag);

  var player = _V_('example_1');
  ok(player.ready !== undefined, 'ready callback is defined');
  player.dispose();
});
