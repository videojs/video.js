import VideoTrack from '../../../src/js/tracks/video-track';
import VideoTrackList from '../../../src/js/tracks/video-track-list';
import {VideoTrackKind} from '../../../src/js/tracks/track-enums';
import TrackBaseline from './track-baseline';

q.module('Video Track');

// do baseline track testing
TrackBaseline(VideoTrack, {
  id: '1',
  language: 'en',
  label: 'English',
  kind: 'main',
});

test('can create an VideoTrack a selected property', function() {
  let selected = true;
  let track = new VideoTrack({
    selected,
  });
  equal(track.selected, selected, 'selected value matches what we passed in');
});

test('defaults when items not provided', function() {
  let track = new VideoTrack();

  equal(track.kind, '', 'kind defaulted to empty string');
  equal(track.selected, false, 'selected defaulted to true since there is one track');
  equal(track.label, '', 'label defaults to empty string');
  equal(track.language, '', 'language defaults to empty string');
  ok(track.id.match(/vjs_track_\d{5}/), 'id defaults to vjs_track_GUID');
});

test('kind can only be one of several options, defaults to empty string', function() {
  let track = new VideoTrack({
    kind: 'foo'
  });

  equal(track.kind, '', 'the kind is set to empty string, not foo');
  notEqual(track.kind, 'foo', 'the kind is set to empty string, not foo');

  // loop through all possible kinds to verify
  for (let key in VideoTrackKind) {
    let currentKind = VideoTrackKind[key];
    let track = new VideoTrack({kind: currentKind});
    equal(track.kind, currentKind, 'the kind is set to ' + currentKind);
  }
});

test('selected can only be instantiated to true or false, defaults to false', function() {
  let track = new VideoTrack({
    selected: 'foo'
  });

  equal(track.selected, false, 'the selected value is set to false, not foo');
  notEqual(track.selected, 'foo', 'the selected value is not set to foo');

  track = new VideoTrack({
    selected: true
  });

  equal(track.selected, true, 'the selected value is set to true');

  track = new VideoTrack({
    selected: false
  });

  equal(track.selected, false, 'the selected value is set to false');
});

test('selected can only be changed to true or false', function() {
  let track = new VideoTrack();

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

test('when selected is changed selectedchange event is fired', function() {
  let track = new VideoTrack({
    selected: false
  });
  let eventsTriggered = 0;
  track.addEventListener('selectedchange', () => {
    eventsTriggered++;
  });

  // two events
  track.selected = true;
  track.selected = false;
  equal(eventsTriggered, 2, 'two selected changes');

  // no event here
  track.selected = false;
  track.selected = false;
  equal(eventsTriggered, 2, 'still two selected changes');

  // one event
  track.selected = true;
  equal(eventsTriggered, 3, 'three selected changes');
});
