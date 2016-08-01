/* eslint-env qunit */
import TextTrackList from '../../../src/js/tracks/text-track-list.js';
import TextTrack from '../../../src/js/tracks/text-track.js';
import EventTarget from '../../../src/js/event-target.js';

QUnit.module('Text Track List');
QUnit.test('trigger "change" event when "modechange" is fired on a track', function() {
  const tt = new EventTarget();
  const ttl = new TextTrackList([tt]);
  let changes = 0;
  const changeHandler = function() {
    changes++;
  };

  ttl.on('change', changeHandler);
  tt.trigger('modechange');

  ttl.off('change', changeHandler);
  ttl.onchange = changeHandler;

  tt.trigger('modechange');
  QUnit.equal(changes, 2, 'two change events should have fired');
});

QUnit.test('trigger "change" event when mode changes on a TextTrack', function() {
  const tt = new TextTrack({
    tech: {
      on() {}
    }
  });
  const ttl = new TextTrackList([tt]);
  let changes = 0;
  const changeHandler = function() {
    changes++;
  };

  ttl.on('change', changeHandler);
  tt.mode = 'showing';

  ttl.off('change', changeHandler);
  ttl.onchange = changeHandler;

  tt.mode = 'hidden';
  tt.mode = 'disabled';

  QUnit.equal(changes, 3, 'three change events should have fired');
});
