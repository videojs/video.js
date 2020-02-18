/* eslint-env qunit */
import TextTrackList from '../../../src/js/tracks/text-track-list.js';
import TextTrack from '../../../src/js/tracks/text-track.js';
import EventTarget from '../../../src/js/event-target.js';
import TechFaker from '../tech/tech-faker';
import sinon from 'sinon';

QUnit.module('Text Track List', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
  },
  afterEach() {
    this.clock.restore();
  }
});

QUnit.test('trigger "change" event when "modechange" is fired on a track', function(assert) {
  const tt = new EventTarget();
  const ttl = new TextTrackList([tt]);
  let changes = 0;
  const changeHandler = function() {
    changes++;
  };

  ttl.on('change', changeHandler);
  tt.trigger('modechange');
  this.clock.tick(1);

  ttl.off('change', changeHandler);
  ttl.onchange = changeHandler;

  tt.trigger('modechange');
  this.clock.tick(1);
  assert.equal(changes, 2, 'two change events should have fired');

  ttl.removeTrack(tt);
});

QUnit.test('trigger "change" event when mode changes on a TextTrack', function(assert) {
  const tech = new TechFaker();
  const tt = new TextTrack({tech});
  const ttl = new TextTrackList([tt]);
  let changes = 0;
  const changeHandler = function() {
    changes++;
  };

  ttl.on('change', changeHandler);
  tt.mode = 'showing';
  this.clock.tick(1);

  ttl.off('change', changeHandler);
  ttl.onchange = changeHandler;

  tt.mode = 'hidden';
  tt.mode = 'disabled';
  this.clock.tick(1);

  assert.equal(changes, 2, 'two change events should have fired');
  ttl.removeTrack(tt);
  tech.dispose();
});
