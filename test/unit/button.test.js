import Button from '../../src/js/button.js';
import TestHelpers from './test-helpers.js';

q.module('Button');

test('should localize its text', function(){
  expect(1);

  var player, testButton, el;

  player = TestHelpers.makePlayer({
    'language': 'es',
    'languages': {
      'es': {
        'Play': 'Juego'
      }
    }
  });

  testButton = new Button(player);
  testButton.controlText_ = 'Play';
  el = testButton.createEl();

  ok(el.innerHTML.match('Juego'));
});
