module('Text Track UI Controls');

var track = {
  kind: 'captions',
  label: 'test'
};

test('should be displayed when text tracks list is not empty', function() {
  var player = PlayerTest.makePlayer({
    tracks: [track]
  });

  equal(player
    .el()
    .querySelector('.vjs-captions-button')
    .style['display'], 'block', 'control is displayed');
  equal(player.textTracks().length, 1, 'textTracks contains one item');
});

test('should be displayed when a text track is added to an empty track list', function() {
  var player = PlayerTest.makePlayer();

  player.addRemoteTextTrack(track);

  equal(player
    .el()
    .querySelector('.vjs-captions-button')
    .style['display'], 'block', 'control is displayed');
  equal(player.textTracks().length, 1, 'textTracks contains one item');
});

test('should not be displayed when text tracks list is empty', function() {
  var player = PlayerTest.makePlayer();

  equal(player
    .el()
    .querySelector('.vjs-captions-button')
    .style['display'], 'none', 'control is not displayed');
  equal(player.textTracks().length, 0, 'textTracks is empty');
});

test('should not be displayed when last text track is removed', function() {
  var player = PlayerTest.makePlayer({
    tracks: [track]
  });

  player.removeRemoteTextTrack(player.textTracks()[0]);

  equal(player
    .el()
    .querySelector('.vjs-captions-button')
    .style['display'], 'none', 'control is not displayed');
  equal(player.textTracks().length, 0, 'textTracks is empty');
});

test('menu should contain "Settings", "Off" and one tracks', function() {
  var player = PlayerTest.makePlayer({
    tracks: [track]
  });

  equal(player
    .el()
    .querySelector('.vjs-captions-button')
    .getElementsByClassName('vjs-menu-item')
    .length, 3, 'menu contains three items');
});

test('menu should update with addRemoteTextTrack', function() {
  var player = PlayerTest.makePlayer({
    tracks: [track]
  });

  player.addRemoteTextTrack(track);

  equal(player
    .el()
    .querySelector('.vjs-captions-button')
    .getElementsByClassName('vjs-menu-item')
    .length, 4, 'menu does contain added track');
  equal(player.textTracks().length, 2, 'textTracks contains two items');
});

test('menu should update with removeRemoteTextTrack', function() {
  var player = PlayerTest.makePlayer({
    tracks: [track, track]
  });

  player.removeRemoteTextTrack(player.textTracks()[0]);

  equal(player
    .el()
    .querySelector('.vjs-captions-button')
    .getElementsByClassName('vjs-menu-item')
    .length, 3, 'menu does not contain removed track');
  equal(player.textTracks().length, 1, 'textTracks contains one item');
});
