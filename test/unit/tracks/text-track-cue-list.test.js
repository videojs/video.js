/* eslint-env qunit */
import TextTrackCueList from '../../../src/js/tracks/text-track-cue-list.js';

const genericTracks = [
  {
    id: '1'
  }, {
    id: '2'
  }, {
    id: '3'
  }
];

QUnit.module('Text Track Cue List');

QUnit.test('TextTrackCueList\'s length is set correctly', function(assert) {
  const ttcl = new TextTrackCueList(genericTracks);

  assert.equal(ttcl.length, genericTracks.length, 'the length is ' + genericTracks.length);
});

QUnit.test('can get cues by id', function(assert) {
  const ttcl = new TextTrackCueList(genericTracks);

  assert.equal(ttcl.getCueById('1').id, 1, 'id "1" has id of "1"');
  assert.equal(ttcl.getCueById('2').id, 2, 'id "2" has id of "2"');
  assert.equal(ttcl.getCueById('3').id, 3, 'id "3" has id of "3"');
  assert.ok(!ttcl.getCueById(1), 'there isn\'t an item with "numeric" id of `1`');
});

QUnit.test('length is updated when new tracks are added or removed', function(assert) {
  const ttcl = new TextTrackCueList(genericTracks);

  ttcl.setCues_(genericTracks.concat([{id: '100'}]));
  assert.equal(ttcl.length, genericTracks.length + 1,
              'the length is ' + (genericTracks.length + 1));
  ttcl.setCues_(genericTracks.concat([{id: '100'}, {id: '101'}]));
  assert.equal(ttcl.length, genericTracks.length + 2,
              'the length is ' + (genericTracks.length + 2));

  ttcl.setCues_(genericTracks.concat([{id: '100'}]));
  assert.equal(ttcl.length, genericTracks.length + 1,
              'the length is ' + (genericTracks.length + 1));
  ttcl.setCues_(genericTracks);
  assert.equal(ttcl.length, genericTracks.length, 'the length is ' + genericTracks.length);
});

QUnit.test('can access items by index', function(assert) {
  const ttcl = new TextTrackCueList(genericTracks);
  const length = ttcl.length;

  assert.expect(length);

  for (let i = 0; i < length; i++) {
    assert.equal(ttcl[i].id, String(i + 1), 'the id of a track matches the index + 1');
  }
});

QUnit.test('can access new items by index', function(assert) {
  const ttcl = new TextTrackCueList(genericTracks);

  ttcl.setCues_(genericTracks.concat([{id: '100'}]));

  assert.equal(ttcl[3].id, '100', 'id of item at index 3 is 100');
  ttcl.setCues_(genericTracks.concat([{id: '100'}, {id: '101'}]));
  assert.equal(ttcl[4].id, '101', 'id of item at index 4 is 101');
});

QUnit.test('cannot access removed items by index', function(assert) {
  const ttcl = new TextTrackCueList(genericTracks);

  ttcl.setCues_(genericTracks.concat([{id: '100'}, {id: '101'}]));
  assert.equal(ttcl[3].id, '100', 'id of item at index 3 is 100');
  assert.equal(ttcl[4].id, '101', 'id of item at index 4 is 101');

  ttcl.setCues_(genericTracks);

  assert.ok(!ttcl[3], 'nothing at index 3');
  assert.ok(!ttcl[4], 'nothing at index 4');
});

QUnit.test('new item available at old index', function(assert) {
  const ttcl = new TextTrackCueList(genericTracks);

  ttcl.setCues_(genericTracks.concat([{id: '100'}]));
  assert.equal(ttcl[3].id, '100', 'id of item at index 3 is 100');

  ttcl.setCues_(genericTracks);
  assert.ok(!ttcl[3], 'nothing at index 3');

  ttcl.setCues_(genericTracks.concat([{id: '101'}]));
  assert.equal(ttcl[3].id, '101', 'id of new item at index 3 is now 101');
});
