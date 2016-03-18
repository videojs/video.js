import VideoTrackList from '../../../src/js/tracks/video-track-list.js';
import VideoTrack from '../../../src/js/tracks/video-track.js';
import EventTarget from '../../../src/js/event-target.js';

q.module('Video Track List');

test('trigger "change" event when "selectedchange" is fired on loaded a track', function() {
  let track = new EventTarget();
  track.loaded_ = true;
  let list = new VideoTrackList([track]);
  let changes = 0;
  let changeHandler = () => changes++;

  list.on('change', changeHandler);
  track.trigger('selectedchange');

  list.off('change', changeHandler);
  list.onchange = changeHandler;

  track.trigger('selectedchange');
  equal(changes, 2, 'two change events should have fired');
});

test('trigger "change" event when a new VideoTrack is after selected after load', function() {
  let track = new VideoTrack();
  let list = new VideoTrackList([track]);

  let changes = 0;
  let changeHandler = () => changes++;
  list.on('change', changeHandler);
  track.selected = true;

  list.off('change', changeHandler);
  list.onchange = changeHandler;

  track.selected = false;
  track.selected = true;
  track.selected = true;
  equal(changes, 3, 'three change events should have fired');
});
