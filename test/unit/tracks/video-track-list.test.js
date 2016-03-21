import VideoTrackList from '../../../src/js/tracks/video-track-list.js';
import VideoTrack from '../../../src/js/tracks/video-track.js';
import EventTarget from '../../../src/js/event-target.js';

q.module('Video Track List');

test('trigger "change" when "selectedchange" is fired on a track', function() {
  let track = new EventTarget();
  track.loaded_ = true;
  let audioTrackList = new VideoTrackList([track]);
  let changes = 0;
  let changeHandler = function() {
    changes++;
  };
  audioTrackList.on('change', changeHandler);
  track.trigger('selectedchange');
  equal(changes, 1, 'one change events for trigger');

  audioTrackList.off('change', changeHandler);
  audioTrackList.onchange = changeHandler;

  track.trigger('selectedchange');
  equal(changes, 2, 'one change events for another trigger');
});

test('only one track is ever selected', function() {
  let track = new VideoTrack({selected: true});
  let track2 = new VideoTrack({selected: true});
  let track3 = new VideoTrack({selected: true});
  let track4 = new VideoTrack();
  let list = new VideoTrackList([track, track2]);
  equal(track.selected, false, 'track is unselected');
  equal(track2.selected, true, 'track2 is selected');

  track.selected = true;
  equal(track.selected, true, 'track is selected');
  equal(track2.selected, false, 'track2 is unselected');

  list.addTrack_(track3);
  equal(track.selected, false, 'track is unselected');
  equal(track2.selected, false, 'track2 is unselected');
  equal(track3.selected, true, 'track3 is selected');

  track.selected = true;
  equal(track.selected, true, 'track is unselected');
  equal(track2.selected, false, 'track2 is unselected');
  equal(track3.selected, false, 'track3 is unselected');

  list.addTrack_(track4);
  equal(track.selected, true, 'track is selected');
  equal(track2.selected, false, 'track2 is unselected');
  equal(track3.selected, false, 'track3 is unselected');
  equal(track4.selected, false, 'track4 is unselected');

});

test('all tracks can be unselected', function() {
  let track = new VideoTrack();
  let track2 = new VideoTrack();
  let list = new VideoTrackList([track, track2]);
  equal(track.selected, false, 'track is unselected');
  equal(track2.selected, false, 'track2 is unselected');

  track.selected = true;
  equal(track.selected, true, 'track is selected');
  equal(track2.selected, false, 'track2 is unselected');

  track.selected = false;
  equal(track.selected, false, 'track is unselected');
  equal(track2.selected, false, 'track2 is unselected');
});

test('trigger a change event per selected change', function() {
  let track = new VideoTrack({selected: true});
  let track2 = new VideoTrack({selected: true});
  let track3 = new VideoTrack({selected: true});
  let track4 = new VideoTrack();
  let list = new VideoTrackList([track, track2]);

  let change = 0;
  list.on('change', () => change++);
  track.selected = true;
  equal(change, 1, 'one change triggered');

  list.addTrack_(track3);
  equal(change, 2, 'another change triggered by adding an selected track');

  track.selected = true;
  equal(change, 3, 'another change trigger by changing selected');

  track.selected = false;
  equal(change, 4, 'another change trigger by changing selected');

  list.addTrack_(track4);
  equal(change, 4, 'no change triggered by adding a unselected track');
});
