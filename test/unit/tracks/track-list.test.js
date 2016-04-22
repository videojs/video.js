import TrackList from '../../../src/js/tracks/track-list.js';
import EventTarget from '../../../src/js/event-target.js';

const newTrack = function(id) {
  return {
    id,
    addEventListener() {},
    off() {},
  };
};

q.module('Track List', {
  beforeEach() {
    this.tracks = [newTrack('1'), newTrack('2'), newTrack('3')];
  }
});

test('TrackList\'s length is set correctly', function() {
  let trackList = new TrackList(this.tracks);

  equal(trackList.length, this.tracks.length, 'length is ' + this.tracks.length);
});

test('can get tracks by int and string id', function() {
  let trackList = new TrackList(this.tracks);

  equal(trackList.getTrackById('1').id, '1', 'id "1" has id of "1"');
  equal(trackList.getTrackById('2').id, '2', 'id "2" has id of "2"');
  equal(trackList.getTrackById('3').id, '3', 'id "3" has id of "3"');

});

test('length is updated when new tracks are added or removed', function() {
  let trackList = new TrackList(this.tracks);

  trackList.addTrack_(newTrack('100'));
  equal(trackList.length, this.tracks.length + 1, 'the length is ' + (this.tracks.length + 1));
  trackList.addTrack_(newTrack('101'));
  equal(trackList.length, this.tracks.length + 2, 'the length is ' + (this.tracks.length + 2));

  trackList.removeTrack_(trackList.getTrackById('101'));
  equal(trackList.length, this.tracks.length + 1, 'the length is ' + (this.tracks.length + 1));
  trackList.removeTrack_(trackList.getTrackById('100'));
  equal(trackList.length, this.tracks.length, 'the length is ' + this.tracks.length);
});

test('can access items by index', function() {
  let trackList = new TrackList(this.tracks);
  let length = trackList.length;

  expect(length);

  for (let i = 0; i < length; i++) {
    equal(trackList[i].id, String(i + 1), 'the id of a track matches the index + 1');
  }
});

test('can access new items by index', function() {
  let trackList = new TrackList(this.tracks);

  trackList.addTrack_(newTrack('100'));
  equal(trackList[3].id, '100', 'id of item at index 3 is 100');

  trackList.addTrack_(newTrack('101'));
  equal(trackList[4].id, '101', 'id of item at index 4 is 101');
});

test('cannot access removed items by index', function() {
  let trackList = new TrackList(this.tracks);

  trackList.addTrack_(newTrack('100'));
  trackList.addTrack_(newTrack('101'));
  equal(trackList[3].id, '100', 'id of item at index 3 is 100');
  equal(trackList[4].id, '101', 'id of item at index 4 is 101');

  trackList.removeTrack_(trackList.getTrackById('101'));
  trackList.removeTrack_(trackList.getTrackById('100'));

  ok(!trackList[3], 'nothing at index 3');
  ok(!trackList[4], 'nothing at index 4');
});

test('new item available at old index', function() {
  let trackList = new TrackList(this.tracks);

  trackList.addTrack_(newTrack('100'));
  equal(trackList[3].id, '100', 'id of item at index 3 is 100');

  trackList.removeTrack_(trackList.getTrackById('100'));
  ok(!trackList[3], 'nothing at index 3');

  trackList.addTrack_(newTrack('101'));
  equal(trackList[3].id, '101', 'id of new item at index 3 is now 101');
});

test('a "addtrack" event is triggered when new tracks are added', function() {
  let trackList = new TrackList(this.tracks);
  let tracks = 0;
  let adds = 0;
  let addHandler = (e) => {
    if (e.track) {
      tracks++;
    }
    adds++;
  };

  trackList.on('addtrack', addHandler);

  trackList.addTrack_(newTrack('100'));
  trackList.addTrack_(newTrack('101'));

  trackList.off('addtrack', addHandler);
  trackList.onaddtrack = addHandler;

  trackList.addTrack_(newTrack('102'));
  trackList.addTrack_(newTrack('103'));

  equal(adds, 4, 'we got ' + adds + ' "addtrack" events');
  equal(tracks, 4, 'we got a track with every event');
});

test('a "removetrack" event is triggered when tracks are removed', function() {
  let trackList = new TrackList(this.tracks);
  let tracks = 0;
  let rms = 0;
  let rmHandler = (e) => {
    if (e.track) {
      tracks++;
    }
    rms++;
  };

  trackList.on('removetrack', rmHandler);
  trackList.removeTrack_(trackList.getTrackById('1'));
  trackList.removeTrack_(trackList.getTrackById('2'));

  trackList.off('removetrack', rmHandler);
  trackList.onremovetrack = rmHandler;
  trackList.removeTrack_(trackList.getTrackById('3'));

  equal(rms, 3, 'we got ' + rms + ' "removetrack" events');
  equal(tracks, 3, 'we got a track with every event');
});
