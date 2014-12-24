module('Text Track Settings');

var tracks = [{
  kind: 'captions',
  label: 'test'
}];

test('should open on click', function() {
  var player = PlayerTest.makePlayer(tracks);
  vjs.trigger(player.el().querySelector('.vjs-texttrack-settings'), 'click');
  ok(!player.textTrackSettings.hasClass('vjs-hidden'), 'settings open');
});

test('should close on done click', function() {
  var player = PlayerTest.makePlayer(tracks);
  vjs.trigger(player.el().querySelector('.vjs-done-button'), 'click');
  ok(player.textTrackSettings.hasClass('vjs-hidden'), 'settings closed');
});
