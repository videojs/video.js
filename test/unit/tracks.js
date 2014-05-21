module('Tracks');

test('should place title list item into ul', function() {
  var player, chaptersButton;

  player = PlayerTest.makePlayer();

  chaptersButton = new vjs.ChaptersButton(player);

  var menuContentElement = chaptersButton.el().getElementsByTagName('UL')[0];
  var titleElement = menuContentElement.children[0];

  ok(titleElement.innerHTML === 'Chapters', 'title element placed in ul');

  player.dispose();
});

test('cue time parsing', function() {
  var parse = vjs.TextTrack.prototype.parseCueTime;

  equal(parse('11:11'), 671, 'Only minutes and seconds (11:11)');
  equal(parse('11:11:11'), 40271, 'Hours, minutes, seconds (11:11:11)');
  equal(parse('11:11:11.111'), 40271.111, 'Hours, minutes, seconds, decimals (11:11:11.111)');

  // Uncommment to test a fix for #877
  // equal(parse('11:11 line:90%'), 671, 'minutes, seconds with flags');
  // equal(parse('11:11:11 line:90%'), 40271, 'hours, minutes, seconds with flags');
});
