import TextTrackList from '../../../src/js/tracks/text-track-list.js';
import TextTrack from '../../../src/js/tracks/text-track.js';
import EventTarget from '../../../src/js/event-target.js';

var noop = Function.prototype;
var genericTracks = [
  {
    id: '1',
    addEventListener: noop
  }, {
    id: '2',
    addEventListener: noop
  }, {
    id: '3',
    addEventListener: noop
  }
];

q.module('Text Track List');

test('TextTrackList\'s length is set correctly', function() {
  var ttl = new TextTrackList(genericTracks);

  equal(ttl.length, genericTracks.length, 'the length is ' + genericTracks.length);
});

test('can get text tracks by id', function() {
  var ttl = new TextTrackList(genericTracks);

  equal(ttl.getTrackById('1').id, 1, 'id "1" has id of "1"');
  equal(ttl.getTrackById('2').id, 2, 'id "2" has id of "2"');
  equal(ttl.getTrackById('3').id, 3, 'id "3" has id of "3"');
  ok(!ttl.getTrackById(1), 'there isn\'t an item with "numeric" id of `1`');
});

test('length is updated when new tracks are added or removed', function() {
  var ttl = new TextTrackList(genericTracks);

  ttl.addTrack_({id: '100', addEventListener: noop});
  equal(ttl.length, genericTracks.length + 1, 'the length is ' + (genericTracks.length + 1));
  ttl.addTrack_({id: '101', addEventListener: noop});
  equal(ttl.length, genericTracks.length + 2, 'the length is ' + (genericTracks.length + 2));

  ttl.removeTrack_(ttl.getTrackById('101'));
  equal(ttl.length, genericTracks.length + 1, 'the length is ' + (genericTracks.length + 1));
  ttl.removeTrack_(ttl.getTrackById('100'));
  equal(ttl.length, genericTracks.length, 'the length is ' + genericTracks.length);
});

test('can access items by index', function() {
  var ttl = new TextTrackList(genericTracks),
      i = 0,
      length = ttl.length;

  expect(length);

  for (; i < length; i++) {
    equal(ttl[i].id, String(i + 1), 'the id of a track matches the index + 1');
  }
});

test('can access new items by index', function() {
  var ttl = new TextTrackList(genericTracks);

  ttl.addTrack_({id: '100', addEventListener: noop});
  equal(ttl[3].id, '100', 'id of item at index 3 is 100');
  ttl.addTrack_({id: '101', addEventListener: noop});
  equal(ttl[4].id, '101', 'id of item at index 4 is 101');
});

test('cannot access removed items by index', function() {
  var ttl = new TextTrackList(genericTracks);

  ttl.addTrack_({id: '100', addEventListener: noop});
  ttl.addTrack_({id: '101', addEventListener: noop});
  equal(ttl[3].id, '100', 'id of item at index 3 is 100');
  equal(ttl[4].id, '101', 'id of item at index 4 is 101');

  ttl.removeTrack_(ttl.getTrackById('101'));
  ttl.removeTrack_(ttl.getTrackById('100'));

  ok(!ttl[3], 'nothing at index 3');
  ok(!ttl[4], 'nothing at index 4');
});

test('new item available at old index', function() {
  var ttl = new TextTrackList(genericTracks);

  ttl.addTrack_({id: '100', addEventListener: noop});
  equal(ttl[3].id, '100', 'id of item at index 3 is 100');

  ttl.removeTrack_(ttl.getTrackById('100'));
  ok(!ttl[3], 'nothing at index 3');

  ttl.addTrack_({id: '101', addEventListener: noop});
  equal(ttl[3].id, '101', 'id of new item at index 3 is now 101');
});

test('a "addtrack" event is triggered when new tracks are added', function() {
  var ttl = new TextTrackList(genericTracks),
      tracks = 0,
      adds = 0,
      addHandler = function(e) {
        e.track && tracks++;
        adds++;
      };

  ttl.on('addtrack', addHandler);

  ttl.addTrack_({id: '100', addEventListener: noop});
  ttl.addTrack_({id: '101', addEventListener: noop});

  ttl.off('addtrack', addHandler);

  ttl.onaddtrack = addHandler;

  ttl.addTrack_({id: '102', addEventListener: noop});
  ttl.addTrack_({id: '103', addEventListener: noop});

  equal(adds, 4, 'we got ' + adds + ' "addtrack" events');
  equal(tracks, 4, 'we got a track with every event');
});

test('a "removetrack" event is triggered when tracks are removed', function() {
  var ttl = new TextTrackList(genericTracks),
      tracks = 0,
      rms = 0,
      rmHandler = function(e) {
        e.track && tracks++;
        rms++;
      };

  ttl.on('removetrack', rmHandler);

  ttl.removeTrack_(ttl.getTrackById('1'));
  ttl.removeTrack_(ttl.getTrackById('2'));

  ttl.off('removetrack', rmHandler);

  ttl.onremovetrack = rmHandler;

  ttl.removeTrack_(ttl.getTrackById('3'));

  equal(rms, 3, 'we got ' + rms + ' "removetrack" events');
  equal(tracks, 3, 'we got a track with every event');
});

test('trigger "change" event when "modechange" is fired on a track', function() {
  var tt = new EventTarget(),
      ttl = new TextTrackList([tt]),
      changes = 0,
      changeHandler = function() {
        changes++;
      };

  ttl.on('change', changeHandler);

  tt.trigger('modechange');

  ttl.off('change', changeHandler);

  ttl.onchange = changeHandler;

  tt.trigger('modechange');

  equal(changes, 2, 'two change events should have fired');
});

test('trigger "change" event when mode changes on a TextTrack', function() {
  var tt = new TextTrack({
        tech: {
          on: noop
        }
      }),
      ttl = new TextTrackList([tt]),
      changes = 0,
      changeHandler = function() {
        changes++;
      };

  ttl.on('change', changeHandler);

  tt.mode = 'showing';

  ttl.off('change', changeHandler);

  ttl.onchange = changeHandler;

  tt.mode = 'hidden';
  tt.mode = 'disabled';

  equal(changes, 3, 'three change events should have fired');
});
