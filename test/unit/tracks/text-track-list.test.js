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

QUnit.test('toJSON', function(assert) {
  const tech = new TechFaker();
  const ttl = new TextTrackList([]);

  let textTrackListJSON = ttl.toJSON();

  assert.ok(textTrackListJSON.length === 0, 'an empty array is returned when the list is empty');

  const tt1 = new TextTrack({tech});

  ttl.addTrack(tt1);
  textTrackListJSON = ttl.toJSON();

  assert.equal(textTrackListJSON[0].id, tt1.id, 'text track in array of JSON should match the original track');
  assert.notOk(textTrackListJSON[0].tech_, 'tech_ should not exist on the text track value in the JSON list');

  const tt2 = new TextTrack({tech});
  const tt3 = new TextTrack({tech});

  ttl.addTrack(tt2);
  ttl.addTrack(tt3);
  textTrackListJSON = ttl.toJSON();

  assert.equal(textTrackListJSON[1].id, tt2.id, 'text track in second spot of array should match the original track');
  assert.equal(textTrackListJSON[2].id, tt3.id, 'text track in third spot of array should match the original track');
});

QUnit.test('serialize', function(assert) {
  const tech = new TechFaker();
  const tt1 = new TextTrack({tech});
  const tt2 = new TextTrack({tech});
  const tt3 = new TextTrack({tech});
  const ttl = new TextTrackList([tt1, tt2, tt3]);

  const serializedTrackList = JSON.stringify(ttl);

  assert.notOk(serializedTrackList.includes('"tech_":'), 'tech_ does not exist in the serialized data');

  assert.ok(serializedTrackList.includes(`"id":"${tt1.id}"`), 'serialzed track is found for text track 1');
  assert.ok(serializedTrackList.includes(`"id":"${tt2.id}"`), 'serialzed track is found for text track 2');
  assert.ok(serializedTrackList.includes(`"id":"${tt3.id}"`), 'serialzed track is found for text track 3');
});
