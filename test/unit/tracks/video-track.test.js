/* eslint-env qunit */
import VideoTrack from '../../../src/js/tracks/video-track';
import {VideoTrackKind} from '../../../src/js/tracks/track-enums';
import TrackBaseline from './track-baseline';

QUnit.module('Video Track');

// do baseline track testing
TrackBaseline(VideoTrack, {
  id: '1',
  language: 'en',
  label: 'English',
  kind: 'main'
});

QUnit.test('can create an VideoTrack a selected property', function() {
  const selected = true;
  const track = new VideoTrack({
    selected
  });

  QUnit.equal(track.selected, selected, 'selected value matches what we passed in');
});

QUnit.test('defaults when items not provided', function() {
  const track = new VideoTrack();

  QUnit.equal(track.kind, '', 'kind defaulted to empty string');
  QUnit.equal(track.selected,
              false,
              'selected defaulted to true since there is one track');
  QUnit.equal(track.label, '', 'label defaults to empty string');
  QUnit.equal(track.language, '', 'language defaults to empty string');
  QUnit.ok(track.id.match(/vjs_track_\d{5}/), 'id defaults to vjs_track_GUID');
});

QUnit.test('kind can only be one of several options, defaults to empty string', function() {
  const track1 = new VideoTrack({
    kind: 'foo'
  });

  QUnit.equal(track1.kind, '', 'the kind is set to empty string, not foo');
  QUnit.notEqual(track1.kind, 'foo', 'the kind is set to empty string, not foo');

  // loop through all possible kinds to verify
  for (const key in VideoTrackKind) {
    const currentKind = VideoTrackKind[key];
    const track = new VideoTrack({kind: currentKind});

    QUnit.equal(track.kind, currentKind, 'the kind is set to ' + currentKind);
  }
});

QUnit.test('selected can only be instantiated to true or false, defaults to false', function() {
  let track = new VideoTrack({
    selected: 'foo'
  });

  QUnit.equal(track.selected, false, 'the selected value is set to false, not foo');
  QUnit.notEqual(track.selected, 'foo', 'the selected value is not set to foo');

  track = new VideoTrack({
    selected: true
  });

  QUnit.equal(track.selected, true, 'the selected value is set to true');

  track = new VideoTrack({
    selected: false
  });

  QUnit.equal(track.selected, false, 'the selected value is set to false');
});

QUnit.test('selected can only be changed to true or false', function() {
  const track = new VideoTrack();

  track.selected = 'foo';
  QUnit.notEqual(track.selected, 'foo', 'selected not set to invalid value, foo');
  QUnit.equal(track.selected, false, 'selected remains on the old value, false');

  track.selected = true;
  QUnit.equal(track.selected, true, 'selected was set to true');

  track.selected = 'baz';
  QUnit.notEqual(track.selected, 'baz', 'selected not set to invalid value, baz');
  QUnit.equal(track.selected, true, 'selected remains on the old value, true');

  track.selected = false;
  QUnit.equal(track.selected, false, 'selected was set to false');
});

QUnit.test('when selected is changed selectedchange event is fired', function() {
  const track = new VideoTrack({
    selected: false
  });
  let eventsTriggered = 0;

  track.addEventListener('selectedchange', () => {
    eventsTriggered++;
  });

  // two events
  track.selected = true;
  track.selected = false;
  QUnit.equal(eventsTriggered, 2, 'two selected changes');

  // no event here
  track.selected = false;
  track.selected = false;
  QUnit.equal(eventsTriggered, 2, 'still two selected changes');

  // one event
  track.selected = true;
  QUnit.equal(eventsTriggered, 3, 'three selected changes');
});
