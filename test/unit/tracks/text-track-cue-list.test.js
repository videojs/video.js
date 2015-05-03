import TextTrackCueList from '../../../src/js/tracks/text-track-cue-list.js';

let genericTracks = [
  {
    id: '1'
  }, {
    id: '2'
  }, {
    id: '3'
  }
];

q.module('Text Track Cue List');

test('TextTrackCueList\'s length is set correctly', function() {
  var ttcl = new TextTrackCueList(genericTracks);

  equal(ttcl.length, genericTracks.length, 'the length is ' + genericTracks.length);
});

test('can get cues by id', function() {
  var ttcl = new TextTrackCueList(genericTracks);

  equal(ttcl.getCueById('1').id, 1, 'id "1" has id of "1"');
  equal(ttcl.getCueById('2').id, 2, 'id "2" has id of "2"');
  equal(ttcl.getCueById('3').id, 3, 'id "3" has id of "3"');
  ok(!ttcl.getCueById(1), 'there isn\'t an item with "numeric" id of `1`');
});

test('length is updated when new tracks are added or removed', function() {
  var ttcl = new TextTrackCueList(genericTracks);

  ttcl.setCues_(genericTracks.concat([{id: '100'}]));
  equal(ttcl.length, genericTracks.length + 1, 'the length is ' + (genericTracks.length + 1));
  ttcl.setCues_(genericTracks.concat([{id: '100'}, {id: '101'}]));
  equal(ttcl.length, genericTracks.length + 2, 'the length is ' + (genericTracks.length + 2));

  ttcl.setCues_(genericTracks.concat([{id: '100'}]));
  equal(ttcl.length, genericTracks.length + 1, 'the length is ' + (genericTracks.length + 1));
  ttcl.setCues_(genericTracks);
  equal(ttcl.length, genericTracks.length, 'the length is ' + genericTracks.length);
});

test('can access items by index', function() {
  var ttcl = new TextTrackCueList(genericTracks),
      i = 0,
      length = ttcl.length;

  expect(length);

  for (; i < length; i++) {
    equal(ttcl[i].id, String(i + 1), 'the id of a track matches the index + 1');
  }
});

test('can access new items by index', function() {
  var ttcl = new TextTrackCueList(genericTracks);

  ttcl.setCues_(genericTracks.concat([{id: '100'}]));

  equal(ttcl[3].id, '100', 'id of item at index 3 is 100');
  ttcl.setCues_(genericTracks.concat([{id: '100'}, {id: '101'}]));
  equal(ttcl[4].id, '101', 'id of item at index 4 is 101');
});

test('cannot access removed items by index', function() {
  var ttcl = new TextTrackCueList(genericTracks);

  ttcl.setCues_(genericTracks.concat([{id: '100'}, {id: '101'}]));
  equal(ttcl[3].id, '100', 'id of item at index 3 is 100');
  equal(ttcl[4].id, '101', 'id of item at index 4 is 101');

  ttcl.setCues_(genericTracks);

  ok(!ttcl[3], 'nothing at index 3');
  ok(!ttcl[4], 'nothing at index 4');
});

test('new item available at old index', function() {
  var ttcl = new TextTrackCueList(genericTracks);

  ttcl.setCues_(genericTracks.concat([{id: '100'}]));
  equal(ttcl[3].id, '100', 'id of item at index 3 is 100');

  ttcl.setCues_(genericTracks);
  ok(!ttcl[3], 'nothing at index 3');

  ttcl.setCues_(genericTracks.concat([{id: '101'}]));
  equal(ttcl[3].id, '101', 'id of new item at index 3 is now 101');
});
