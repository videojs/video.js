module('MenuButton');

test('should place title list item into ul', function() {
  var player, menuButton;

  player = PlayerTest.makePlayer();

  menuButton = new vjs.MenuButton(player, {
    'title': 'testTitle'
  });

  var menuContentElement = menuButton.el().getElementsByTagName('UL')[0];
  var titleElement = menuContentElement.children[0];

  ok(titleElement.innerHTML === 'TestTitle', 'title element placed in ul');

  player.dispose();
});