/* eslint-env qunit */
import Button from '../../src/js/button.js';
import TestHelpers from './test-helpers.js';

QUnit.module('Button');

QUnit.test('should localize its text', function() {
  QUnit.expect(3);

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

  QUnit.ok(el.nodeName.toLowerCase().match('button'));
  QUnit.ok(el.innerHTML.match(/vjs-control-text"?>Juego/));
  QUnit.equal(el.getAttribute('title'), 'Juego');
});
