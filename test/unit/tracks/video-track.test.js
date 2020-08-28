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

QUnit.test('can create an VideoTrack a selected property', function(assert) {
  const selected = true;
  const track = new VideoTrack({
    selected
  });

  assert.equal(track.selected, selected, 'selected value matches what we passed in');
});

QUnit.test('defaults when items not provided', function(assert) {
  const track = new VideoTrack();

  assert.equal(track.kind, '', 'kind defaulted to empty string');
  assert.equal(
    track.selected,
    false,
    'selected defaulted to true since there is one track'
  );
  assert.equal(track.label, '', 'label defaults to empty string');
  assert.equal(track.language, '', 'language defaults to empty string');
  assert.ok(track.id.match(/vjs_track_\d+/), 'id defaults to vjs_track_GUID');
});

QUnit.test('kind can only be one of several options, defaults to empty string', function(assert) {
  const track1 = new VideoTrack({
    kind: 'foo'
  });

  assert.equal(track1.kind, '', 'the kind is set to empty string, not foo');
  assert.notEqual(track1.kind, 'foo', 'the kind is set to empty string, not foo');

  // loop through all possible kinds to verify
  for (const key in VideoTrackKind) {
    const currentKind = VideoTrackKind[key];
    const track = new VideoTrack({kind: currentKind});

    assert.equal(track.kind, currentKind, 'the kind is set to ' + currentKind);
  }
});

QUnit.test('selected can only be instantiated to true or false, defaults to false', function(assert) {
  let track = new VideoTrack({
    selected: 'foo'
  });

  assert.equal(track.selected, false, 'the selected value is set to false, not foo');
  assert.notEqual(track.selected, 'foo', 'the selected value is not set to foo');

  track = new VideoTrack({
    selected: true
  });

  assert.equal(track.selected, true, 'the selected value is set to true');

  track = new VideoTrack({
    selected: false
  });

  assert.equal(track.selected, false, 'the selected value is set to false');
});

QUnit.test('selected can only be changed to true or false', function(assert) {
  const track = new VideoTrack();

  track.selected = 'foo';
  assert.notEqual(track.selected, 'foo', 'selected not set to invalid value, foo');
  assert.equal(track.selected, false, 'selected remains on the old value, false');

  track.selected = true;
  assert.equal(track.selected, true, 'selected was set to true');

  track.selected = 'baz';
  assert.notEqual(track.selected, 'baz', 'selected not set to invalid value, baz');
  assert.equal(track.selected, true, 'selected remains on the old value, true');

  track.selected = false;
  assert.equal(track.selected, false, 'selected was set to false');
});

QUnit.test('when selected is changed selectedchange event is fired', function(assert) {
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
  assert.equal(eventsTriggered, 2, 'two selected changes');

  // no event here
  track.selected = false;
  track.selected = false;
  assert.equal(eventsTriggered, 2, 'still two selected changes');

  // one event
  track.selected = true;
  assert.equal(eventsTriggered, 3, 'three selected changes');

  track.off();
});
