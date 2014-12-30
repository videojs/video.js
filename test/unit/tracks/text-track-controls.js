module('Text Track Controls');

var track = {
  kind: 'captions',
  label: 'test'
};

test('should be displayed when text tracks list is not empty', function() {
  var player = PlayerTest.makePlayer({
    tracks: [track]
  });

  ok(!player.controlBar.captionsButton.hasClass('vjs-hidden'), 'control is displayed');
  equal(player.textTracks().length, 1, 'textTracks contains one item');
});

test('should be displayed when a text track is added to an empty track list', function() {
  var player = PlayerTest.makePlayer();

  player.addRemoteTextTrack(track);

  ok(!player.controlBar.captionsButton.hasClass('vjs-hidden'), 'control is displayed');
  equal(player.textTracks().length, 1, 'textTracks contains one item');
});

test('should not be displayed when text tracks list is empty', function() {
  var player = PlayerTest.makePlayer();

  ok(player.controlBar.captionsButton.hasClass('vjs-hidden'), 'control is not displayed');
  equal(player.textTracks().length, 0, 'textTracks is empty');
});

test('should not be displayed when last text track is removed', function() {
  var player = PlayerTest.makePlayer({
    tracks: [track]
  });

  player.removeRemoteTextTrack(player.textTracks()[0]);

  ok(player.controlBar.captionsButton.hasClass('vjs-hidden'), 'control is not displayed');
  equal(player.textTracks().length, 0, 'textTracks is empty');
});

test('menu should contain "Settings", "Off" and one track', function() {
  var player = PlayerTest.makePlayer({
      tracks: [track]
    }),
    menuItems = player.controlBar.captionsButton.items;

  equal(menuItems.length, 3, 'menu contains three items');
  equal(menuItems[0].track.label, 'captions settings', 'menu contains "captions settings"');
  equal(menuItems[1].track.label, 'captions off', 'menu contains "captions off"');
  equal(menuItems[2].track.label, 'test', 'menu contains "test" track');
});

test('menu should update with addRemoteTextTrack', function() {
  var player = PlayerTest.makePlayer({
    tracks: [track]
  });

  player.addRemoteTextTrack(track);

  equal(player.controlBar.captionsButton.items.length, 4, 'menu does contain added track');
  equal(player.textTracks().length, 2, 'textTracks contains two items');
});

test('menu should update with removeRemoteTextTrack', function() {
  var player = PlayerTest.makePlayer({
    tracks: [track, track]
  });

  player.removeRemoteTextTrack(player.textTracks()[0]);

  equal(player.controlBar.captionsButton.items.length, 3, 'menu does not contain removed track');
  equal(player.textTracks().length, 1, 'textTracks contains one item');
});
