module('Button');

test('should localize its text', function(){
  expect(1);

  var player, testButton, el;

  player = PlayerTest.makePlayer({
    'language': 'es',
    'languages': {
      'es': {
        'Play': 'Juego'
      }
    }
  });

  testButton = new vjs.Button(player);
  testButton.buttonText = 'Play';
  el = testButton.createEl();

  ok(el.textContent, 'Juego', 'translation was successful');
});
