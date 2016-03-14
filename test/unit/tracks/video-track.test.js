import VideoTrack from '../../../src/js/tracks/video-track';
import VideoTrackList from '../../../src/js/tracks/video-track-list';
import * as VideoTrackEnums from '../../../src/js/tracks/video-track-enums';
import TrackBaseline from './track-baseline';

const defaultTech = {
  videoTracks() {},
  on() {},
  off() {},
  currentTime() {}
};

q.module('Video Track', {
  beforeEach() {
    this.videoTrackList = new VideoTrackList();
    this.tech = defaultTech;
    this.tech.videoTracks = () => {
      return this.videoTrackList;
    };
  }
});

// do baseline track testing
TrackBaseline(VideoTrack, {
  id: '1',
  language: 'en',
  label: 'English',
  kind: 'main',
  tech: defaultTech
});

test('Can create an VideoTrack a selected property', function() {
  let selected = true;
  let track = new VideoTrack({
    selected,
    tech: this.tech
  });
  equal(track.selected, selected, 'selected value matches what we passed in');
});

test('defaults when items not provided', function() {
  let track = new VideoTrack({
    tech: this.tech
  });

  equal(track.kind, '', 'kind defaulted to empty string');
  equal(track.selected, false, 'selected defaulted to true since there is one track');
  equal(track.label, '', 'label defaults to empty string');
  equal(track.language, '', 'language defaults to empty string');
  ok(track.id.match(/vjs_video_track_\d{5}/), 'id defaults to vjs_video_track_GUID');
});

test('kind can only be one of several options, defaults to empty string', function() {
  let track = new VideoTrack({
    tech: this.tech,
    kind: 'foo'
  });

  equal(track.kind, '', 'the kind is set to empty string, not foo');
  notEqual(track.kind, 'foo', 'the kind is set to empty string, not foo');

  // loop through all possible kinds to verify
  for(let key in VideoTrackEnums.VideoTrackKind) {
    let currentKind = VideoTrackEnums.VideoTrackKind[key];
    let track = new VideoTrack({
      tech: this.tech,
      kind: currentKind,
    });
    equal(track.kind, currentKind, 'the kind is set to ' + currentKind);
  }
});

test('selected can only be instantiated to true or false, defaults to false', function() {
  let track = new VideoTrack({
    tech: this.tech,
    selected: 'foo'
  });

  equal(track.selected, false, 'the selected value is set to false, not foo');
  notEqual(track.selected, 'foo', 'the selected value is not set to foo');

  track = new VideoTrack({
    tech: this.tech,
    selected: true
  });

  equal(track.selected, true, 'the selected value is set to true');

  track = new VideoTrack({
    tech: this.tech,
    selected: false
  });

  equal(track.selected, false, 'the selected value is set to false');
});

test('selected can only be changed to true or false', function() {
  let track = new VideoTrack({
    tech: this.tech,
  });

  track.selected = 'foo';
  notEqual(track.selected, 'foo', 'selected not set to invalid value, foo');
  equal(track.selected, false, 'selected remains on the old value, false');

  track.selected = true;
  equal(track.selected, true, 'selected was set to true');

  track.selected = 'baz';
  notEqual(track.selected, 'baz', 'selected not set to invalid value, baz');
  equal(track.selected, true, 'selected remains on the old value, true');

  track.selected = false;
  equal(track.selected, false, 'selected was set to false');
});

test('selected can only be set on one track at a time', function() {
  let track1 = new VideoTrack({
    tech: this.tech,
    selected: true
  });
  this.videoTrackList.addTrack_(track1);
  let track2 = new VideoTrack({
    tech: this.tech,
    selected: true
  });
  this.videoTrackList.addTrack_(track2);

  equal(track1.selected, false, 'track 1 is not selected');
  equal(track2.selected, true, 'track 2 is selected');

  track1.selected = true;
  equal(track1.selected, true, 'track 1 is selected');
  equal(track2.selected, false, 'track 2 is not selected');

  track2.selected = true;
  equal(track1.selected, false, 'track 1 is not selected');
  equal(track2.selected, true, 'track 2 is selected');

});

test('all selected can be false', function() {
  let track1 = new VideoTrack({
    tech: this.tech,
    selected: false
  });
  this.videoTrackList.addTrack_(track1);
  let track2 = new VideoTrack({
    tech: this.tech,
    selected: false
  });
  this.videoTrackList.addTrack_(track2);

  equal(track1.selected, false, 'track 1 is not selected');
  equal(track2.selected, false, 'track 2 is not selected');

  track1.selected = true;
  track1.selected = false;
  equal(track1.selected, false, 'track 1 is not selected');
  equal(track2.selected, false, 'track 2 is not selected');
});

test('when selected is changed selectedchange event is fired', function() {
  let track = new VideoTrack({
    tech: this.tech,
    selected: false
  });
  let eventsTriggered = 0;
  track.addEventListener('selectedchange', () => {
    eventsTriggered++;
  });

  // two events
  track.selected = true;
  track.selected = false;

  // no event here
  track.selected = false;
  track.selected = false;

  // one event
  track.selected = true;

  // no events
  track.selected = true;
  track.selected = true;

  equal(eventsTriggered, 3, 'three selected changes');
});
