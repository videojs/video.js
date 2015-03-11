module('Button');

var Button = vjs.Button;

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

  testButton = new Button(player);
  testButton.buttonText = 'Play';
  el = testButton.createEl();

  ok(el.innerHTML, 'Juego', 'translation was successful');
});
