/* eslint-env qunit */
import videojs from '../../src/js/video.js';
import TestHelpers from './test-helpers.js';
import * as Dom from '../../src/js/utils/dom.js';
import document from 'global/document';

QUnit.module('video.js');

QUnit.test('should create a video tag and have access children in old IE', function() {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"><source type="video/mp4"></video>';

  const vid = document.getElementById('test_vid_id');

  QUnit.ok(vid.childNodes.length === 1);
  QUnit.ok(vid.childNodes[0].getAttribute('type') === 'video/mp4');
});

QUnit.test('should return a video player instance', function() {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"></video>' +
                       '<video id="test_vid_id2"></video>';

  const player = videojs('test_vid_id', { techOrder: ['techFaker'] });

  QUnit.ok(player, 'created player from tag');
  QUnit.ok(player.id() === 'test_vid_id');
  QUnit.ok(videojs.getPlayers().test_vid_id === player,
           'added player to global reference');

  const playerAgain = videojs('test_vid_id');

  QUnit.ok(player === playerAgain, 'did not create a second player from same tag');

  QUnit.equal(player, playerAgain, 'we did not make a new player');

  const tag2 = document.getElementById('test_vid_id2');
  const player2 = videojs(tag2, { techOrder: ['techFaker'] });

  QUnit.ok(player2.id() === 'test_vid_id2', 'created player from element');
});

QUnit.test('should return a video player instance from el html5 tech', function() {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"></video>' +
                       '<video id="test_vid_id2"></video>';

  const vid = document.querySelector('#test_vid_id');

  const player = videojs(vid);

  QUnit.ok(player, 'created player from tag');
  QUnit.ok(player.id() === 'test_vid_id');
  QUnit.ok(videojs.getPlayers().test_vid_id === player,
           'added player to global reference');

  const playerAgain = videojs(vid);

  QUnit.ok(player === playerAgain, 'did not create a second player from same tag');
  QUnit.equal(player, playerAgain, 'we did not make a new player');

  const tag2 = document.getElementById('test_vid_id2');
  const player2 = videojs(tag2, { techOrder: ['techFaker'] });

  QUnit.ok(player2.id() === 'test_vid_id2', 'created player from element');
});

QUnit.test('should return a video player instance from el techfaker', function() {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"></video>' +
                       '<video id="test_vid_id2"></video>';

  const vid = document.querySelector('#test_vid_id');
  const player = videojs(vid, {techOrder: ['techFaker']});

  QUnit.ok(player, 'created player from tag');
  QUnit.ok(player.id() === 'test_vid_id');
  QUnit.ok(videojs.getPlayers().test_vid_id === player,
           'added player to global reference');

  const playerAgain = videojs(vid);

  QUnit.ok(player === playerAgain, 'did not create a second player from same tag');
  QUnit.equal(player, playerAgain, 'we did not make a new player');

  const tag2 = document.getElementById('test_vid_id2');
  const player2 = videojs(tag2, { techOrder: ['techFaker'] });

  QUnit.ok(player2.id() === 'test_vid_id2', 'created player from element');
});

QUnit.test('should add the value to the languages object', function() {
  const code = 'es';
  const data = {Hello: 'Hola'};
  const result = videojs.addLanguage(code, data);

  QUnit.ok(videojs.options.languages[code], 'should exist');
  QUnit.equal(videojs.options.languages.es.Hello, 'Hola', 'should match');
  QUnit.deepEqual(result.Hello, videojs.options.languages.es.Hello, 'should also match');
});

QUnit.test('should add the value to the languages object with lower case lang code', function() {
  const code = 'DE';
  const data = {Hello: 'Guten Tag'};
  const result = videojs.addLanguage(code, data);

  QUnit.ok(videojs.options.languages[code.toLowerCase()], 'should exist');
  QUnit.equal(videojs.options.languages[code.toLowerCase()].Hello,
              'Guten Tag',
              'should match');
  QUnit.deepEqual(result,
                  videojs.options.languages[code.toLowerCase()],
                  'should also match');
});

QUnit.test('should expose plugin registry function', function() {
  const pluginName = 'foo';
  const pluginFunction = function(options) {};

  QUnit.ok(videojs.plugin, 'should exist');

  videojs.plugin(pluginName, pluginFunction);

  const player = TestHelpers.makePlayer();

  QUnit.ok(player.foo, 'should exist');
  QUnit.equal(player.foo, pluginFunction, 'should be equal');
});

QUnit.test('should expose options and players properties for backward-compatibility', function() {
  QUnit.ok(typeof videojs.options, 'object', 'options should be an object');
  QUnit.ok(typeof videojs.players, 'object', 'players should be an object');
});

QUnit.test('should expose DOM functions', function() {

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

  QUnit.expect(keys.length);
  keys.forEach(function(vjsName) {
    const domName = methods[vjsName];

    QUnit.strictEqual(videojs[vjsName],
                      Dom[domName],
                      `videojs.${vjsName} is a reference to Dom.${domName}`);
  });
});
