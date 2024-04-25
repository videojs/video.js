/* eslint-env qunit */
import TestHelpers from '../test-helpers.js';

const tracks = [{
  kind: 'captions',
  label: 'test'
}];

QUnit.module('Text Track Select');

QUnit.test('should associate with <select>s with <options>s', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks
  });

  const select = player.textTrackSettings.el_.querySelector('select');
  const option = select.querySelector('option');
  const selectAriaLabelledby = select.getAttribute('aria-labelledby');
  const optionAriaLabelledby = option.getAttribute('aria-labelledby');

  assert.ok(
    optionAriaLabelledby.includes(selectAriaLabelledby),
    "select property 'aria-labelledby' is included in its option's property 'aria-labelledby'"
  );
});

QUnit.test('aria-labelledby values must be valid and unique', function(assert) {
  const player = TestHelpers.makePlayer({
    tracks
  });
  const albs = player.$$('.vjs-text-track-settings select[aria-labelledby]');

  albs.forEach(el => {
    const ids = el.getAttribute('aria-labelledby').split(' ');
    const invalidIds = ids.find(id => {
      return !(player.$(`#${id}`));
    });

    assert.notOk(invalidIds, `${el.id} has valid aria-labelledby ids`);

    assert.ok((new Set(ids)).size === ids.length, `${el.id} does not contain duplicate ids`);
  });
});
