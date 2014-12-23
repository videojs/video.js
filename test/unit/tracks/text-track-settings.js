module('Text Track Settings');

var tracks = [{
  kind: 'captions',
  label: 'test'
}];

test('should open on click', function() {
  var player = PlayerTest.makePlayer(tracks);
  vjs.trigger(player.el().querySelector('.vjs-texttrack-settings'), 'click');
  equal(player.el()
    .querySelector('.vjs-caption-settings')
    .style['display'], 'block', 'settings opened');
});

test('should open on done click', function() {
  var player = PlayerTest.makePlayer(tracks);
  vjs.trigger(player.el().querySelector('.vjs-done-button'), 'click');
  equal(player.el()
    .querySelector('.vjs-caption-settings')
    .style['display'], 'none', 'settings closed');
});

test('should increase font on click', function() {
  var player = PlayerTest.makePlayer(tracks);
  vjs.trigger(player.el().querySelector('.font-plus'), 'click');
  equal(player.textTrackSettings.getValues()['fontSize'], '13px', 'font increased');
});

test('should default on click', function() {
  var player = PlayerTest.makePlayer(tracks);
  vjs.trigger(player.el().querySelector('.font-plus'), 'click');
  vjs.trigger(player.el().querySelector('.vjs-default-button'), 'click');
  equal(Object.keys(player.textTrackSettings.getValues()), 0, 'settings are set to default');
});

test('should decrease font on click', function() {
  var player = PlayerTest.makePlayer(tracks);
  vjs.trigger(player.el().querySelector('.font-minus'), 'click');
  equal(player.textTrackSettings.getValues()['fontSize'], '11px', 'font decreased');
});
