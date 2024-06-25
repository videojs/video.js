/* eslint-env qunit */
import Button from '../../src/js/button.js';
import TestHelpers from './test-helpers.js';
import sinon from 'sinon';

QUnit.module('Button');

QUnit.test('should localize its text', function(assert) {
  assert.expect(3);

  const player = TestHelpers.makePlayer({
    language: 'es',
    languages: {
      es: {
        Play: 'Juego'
      }
    }
  });

  const testButton = new Button(player);

  testButton.controlText_ = 'Play';
  const el = testButton.createEl();

  assert.ok(el.nodeName.toLowerCase().match('button'));
  assert.ok(el.innerHTML.match(/vjs-control-text"?[^<>]*>Juego/));
  assert.equal(el.getAttribute('title'), 'Juego');

  testButton.dispose();
  player.dispose();
});

QUnit.test('handleKeyDown()_button', function(assert) {
  assert.expect(1);
  const player = TestHelpers.makePlayer({
    language: 'es',
    languages: {
      es: {
        Play: 'Juego'
      }
    }
  });

  const testButton = new Button(player);

  const event = new KeyboardEvent('keydown', {key: 'Enter'}); // eslint-disable-line no-undef

  const stopPropagationSpy = sinon.spy(event, 'stopPropagation');

  testButton.handleKeyDown(event);
  assert.ok(stopPropagationSpy.called, 'stopPropagation should be called');

  testButton.dispose();
  player.dispose();
});
