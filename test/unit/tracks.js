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