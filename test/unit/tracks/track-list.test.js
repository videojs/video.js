/* eslint-env qunit */
import TrackList from '../../../src/js/tracks/track-list.js';
import EventTarget from '../../../src/js/event-target.js';

const newTrack = function(id) {
  return {
    id,
    addEventListener() {},
    off() {}
  };
};

QUnit.module('Track List', {
  beforeEach() {
    this.tracks = [newTrack('1'), newTrack('2'), newTrack('3')];
  }
});

QUnit.test('TrackList\'s length is set correctly', function(assert) {
  const trackList = new TrackList(this.tracks);

  assert.equal(trackList.length, this.tracks.length, 'length is ' + this.tracks.length);
});

QUnit.test('can get tracks by int and string id', function(assert) {
  const trackList = new TrackList(this.tracks);

  assert.equal(trackList.getTrackById('1').id, '1', 'id "1" has id of "1"');
  assert.equal(trackList.getTrackById('2').id, '2', 'id "2" has id of "2"');
  assert.equal(trackList.getTrackById('3').id, '3', 'id "3" has id of "3"');

});

QUnit.test('length is updated when new tracks are added or removed', function(assert) {
  const trackList = new TrackList(this.tracks);

  trackList.addTrack(newTrack('100'));
  assert.equal(
    trackList.length,
    this.tracks.length + 1,
    'the length is ' + (this.tracks.length + 1)
  );
  trackList.addTrack(newTrack('101'));
  assert.equal(
    trackList.length,
    this.tracks.length + 2,
    'the length is ' + (this.tracks.length + 2)
  );

  trackList.removeTrack(trackList.getTrackById('101'));
  assert.equal(
    trackList.length,
    this.tracks.length + 1,
    'the length is ' + (this.tracks.length + 1)
  );
  trackList.removeTrack(trackList.getTrackById('100'));
  assert.equal(
    trackList.length,
    this.tracks.length,
    'the length is ' + this.tracks.length
  );
});

QUnit.test('can access items by index', function(assert) {
  const trackList = new TrackList(this.tracks);
  const length = trackList.length;

  assert.expect(length);

  for (let i = 0; i < length; i++) {
    assert.equal(
      trackList[i].id,
      String(i + 1),
      'the id of a track matches the index + 1'
    );
  }
});

QUnit.test('can access new items by index', function(assert) {
  const trackList = new TrackList(this.tracks);

  trackList.addTrack(newTrack('100'));
  assert.equal(trackList[3].id, '100', 'id of item at index 3 is 100');

  trackList.addTrack(newTrack('101'));
  assert.equal(trackList[4].id, '101', 'id of item at index 4 is 101');
});

QUnit.test('cannot access removed items by index', function(assert) {
  const trackList = new TrackList(this.tracks);

  trackList.addTrack(newTrack('100'));
  trackList.addTrack(newTrack('101'));
  assert.equal(trackList[3].id, '100', 'id of item at index 3 is 100');
  assert.equal(trackList[4].id, '101', 'id of item at index 4 is 101');

  trackList.removeTrack(trackList.getTrackById('101'));
  trackList.removeTrack(trackList.getTrackById('100'));

  assert.ok(!trackList[3], 'nothing at index 3');
  assert.ok(!trackList[4], 'nothing at index 4');
});

QUnit.test('new item available at old index', function(assert) {
  const trackList = new TrackList(this.tracks);

  trackList.addTrack(newTrack('100'));
  assert.equal(trackList[3].id, '100', 'id of item at index 3 is 100');

  trackList.removeTrack(trackList.getTrackById('100'));
  assert.ok(!trackList[3], 'nothing at index 3');

  trackList.addTrack(newTrack('101'));
  assert.equal(trackList[3].id, '101', 'id of new item at index 3 is now 101');
});

QUnit.test('a "addtrack" event is triggered when new tracks are added', function(assert) {
  const trackList = new TrackList(this.tracks);
  let tracks = 0;
  let adds = 0;
  const addHandler = (e) => {
    if (e.track) {
      tracks++;
    }
    adds++;
  };

  trackList.on('addtrack', addHandler);

  trackList.addTrack(newTrack('100'));
  trackList.addTrack(newTrack('101'));

  trackList.off('addtrack', addHandler);
  trackList.onaddtrack = addHandler;

  trackList.addTrack(newTrack('102'));
  trackList.addTrack(newTrack('103'));

  assert.equal(adds, 4, 'we got ' + adds + ' "addtrack" events');
  assert.equal(tracks, 4, 'we got a track with every event');
});

QUnit.test('a "removetrack" event is triggered when tracks are removed', function(assert) {
  const trackList = new TrackList(this.tracks);
  let tracks = 0;
  let rms = 0;
  const rmHandler = (e) => {
    if (e.track) {
      tracks++;
    }
    rms++;
  };

  trackList.on('removetrack', rmHandler);
  trackList.removeTrack(trackList.getTrackById('1'));
  trackList.removeTrack(trackList.getTrackById('2'));

  trackList.off('removetrack', rmHandler);
  trackList.onremovetrack = rmHandler;
  trackList.removeTrack(trackList.getTrackById('3'));

  assert.equal(rms, 3, 'we got ' + rms + ' "removetrack" events');
  assert.equal(tracks, 3, 'we got a track with every event');
});

QUnit.test('labelchange event is fired for the list when a child track fires labelchange', function(assert) {
  const trackList = new TrackList([new EventTarget()]);
  let labelchanges = 0;
  const labelchangeHandler = (e) => {
    labelchanges++;
  };

  trackList.on('labelchange', labelchangeHandler);
  trackList[0].trigger('labelchange');
  assert.equal(labelchanges, '1', 'labelchange event is fired on tracklist');
});

