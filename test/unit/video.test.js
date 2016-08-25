/* eslint-env qunit */
import videojs from '../../src/js/video.js';
import TestHelpers from './test-helpers.js';
import * as Dom from '../../src/js/utils/dom.js';
import document from 'global/document';

QUnit.module('video.js');

QUnit.test('should create a video tag and have access children in old IE', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"><source type="video/mp4"></video>';

  const vid = document.getElementById('test_vid_id');

  assert.ok(vid.childNodes.length === 1);
  assert.ok(vid.childNodes[0].getAttribute('type') === 'video/mp4');
});

QUnit.test('should return a video player instance', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"></video>' +
                       '<video id="test_vid_id2"></video>';

  const player = videojs('test_vid_id', { techOrder: ['techFaker'] });

  assert.ok(player, 'created player from tag');
  assert.ok(player.id() === 'test_vid_id');
  assert.ok(videojs.getPlayers().test_vid_id === player,
           'added player to global reference');

  const playerAgain = videojs('test_vid_id');

  assert.ok(player === playerAgain, 'did not create a second player from same tag');

  assert.equal(player, playerAgain, 'we did not make a new player');

  const tag2 = document.getElementById('test_vid_id2');
  const player2 = videojs(tag2, { techOrder: ['techFaker'] });

  assert.ok(player2.id() === 'test_vid_id2', 'created player from element');
});

QUnit.test('should return a video player instance from el html5 tech', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"></video>' +
                       '<video id="test_vid_id2"></video>';

  const vid = document.querySelector('#test_vid_id');

  const player = videojs(vid);

  assert.ok(player, 'created player from tag');
  assert.ok(player.id() === 'test_vid_id');
  assert.ok(videojs.getPlayers().test_vid_id === player,
           'added player to global reference');

  const playerAgain = videojs(vid);

  assert.ok(player === playerAgain, 'did not create a second player from same tag');
  assert.equal(player, playerAgain, 'we did not make a new player');

  const tag2 = document.getElementById('test_vid_id2');
  const player2 = videojs(tag2, { techOrder: ['techFaker'] });

  assert.ok(player2.id() === 'test_vid_id2', 'created player from element');
});

QUnit.test('should return a video player instance from el techfaker', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"></video>' +
                       '<video id="test_vid_id2"></video>';

  const vid = document.querySelector('#test_vid_id');
  const player = videojs(vid, {techOrder: ['techFaker']});

  assert.ok(player, 'created player from tag');
  assert.ok(player.id() === 'test_vid_id');
  assert.ok(videojs.getPlayers().test_vid_id === player,
           'added player to global reference');

  const playerAgain = videojs(vid);

  assert.ok(player === playerAgain, 'did not create a second player from same tag');
  assert.equal(player, playerAgain, 'we did not make a new player');

  const tag2 = document.getElementById('test_vid_id2');
  const player2 = videojs(tag2, { techOrder: ['techFaker'] });

  assert.ok(player2.id() === 'test_vid_id2', 'created player from element');
});

QUnit.test('should add the value to the languages object', function(assert) {
  const code = 'es';
  const data = {Hello: 'Hola'};
  const result = videojs.addLanguage(code, data);

  assert.ok(videojs.options.languages[code], 'should exist');
  assert.equal(videojs.options.languages.es.Hello, 'Hola', 'should match');
  assert.deepEqual(result.Hello, videojs.options.languages.es.Hello, 'should also match');
});

QUnit.test('should add the value to the languages object with lower case lang code', function(assert) {
  const code = 'DE';
  const data = {Hello: 'Guten Tag'};
  const result = videojs.addLanguage(code, data);

  assert.ok(videojs.options.languages[code.toLowerCase()], 'should exist');
  assert.equal(videojs.options.languages[code.toLowerCase()].Hello,
              'Guten Tag',
              'should match');
  assert.deepEqual(result,
                  videojs.options.languages[code.toLowerCase()],
                  'should also match');
});

QUnit.test('should expose plugin registry function', function(assert) {
  const pluginName = 'foo';
  const pluginFunction = function(options) {};

  assert.ok(videojs.plugin, 'should exist');

  videojs.plugin(pluginName, pluginFunction);

  const player = TestHelpers.makePlayer();

  assert.ok(player.foo, 'should exist');
  assert.equal(player.foo, pluginFunction, 'should be equal');
  player.dispose();
});

QUnit.test('should expose options and players properties for backward-compatibility', function(assert) {
  assert.ok(typeof videojs.options, 'object', 'options should be an object');
  assert.ok(typeof videojs.players, 'object', 'players should be an object');
});

QUnit.test('should expose DOM functions', function(assert) {

  // Keys are videojs methods, values are Dom methods.
  const methods = {
    isEl: 'isEl',
    isTextNode: 'isTextNode',
    createEl: 'createEl',
    hasClass: 'hasElClass',
    addClass: 'addElClass',
    removeClass: 'removeElClass',
    toggleClass: 'toggleElClass',
    setAttributes: 'setElAttributes',
    getAttributes: 'getElAttributes',
    emptyEl: 'emptyEl',
    insertContent: 'insertContent',
    appendContent: 'appendContent'
  };

  const keys = Object.keys(methods);

  assert.expect(keys.length);
  keys.forEach(function(vjsName) {
    const domName = methods[vjsName];

    assert.strictEqual(videojs[vjsName],
                      Dom[domName],
                      `videojs.${vjsName} is a reference to Dom.${domName}`);
  });
});
