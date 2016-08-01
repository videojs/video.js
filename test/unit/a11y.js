import axe from 'axe-core';
import TestHelpers from './test-helpers.js';

q.module('a11y', {});

q.test('should have no a11y issues, using simple defaults', function(assert) {
  const done = assert.async();
  const player = TestHelpers.makePlayer({
    techOrder: ['html5']
  });

  player.addRemoteTextTrack({
    kind: 'captions',
    srclang: 'en',
    label: 'English'
  });
  player.addRemoteTextTrack({
    kind: 'descriptions',
    srclang: 'en',
    label: 'Descriptions'
  });

  axe.a11yCheck('#qunit-fixture', function(results) {
    console.log(results);
    assert.equal(results.violations.length, 0, 'there are no a11y violations');
    done();
  });
});
