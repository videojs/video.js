/* eslint-env qunit */
import videojs from '../../src/js/video.js';
import * as Dom from '../../src/js/utils/dom.js';
import log from '../../src/js/utils/log.js';
import document from 'global/document';
import sinon from 'sinon';

QUnit.module('video.js', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
  },
  afterEach() {
    this.clock.restore();
    videojs.getAllPlayers().forEach(p => p.dispose());
  }
});

QUnit.test('should return a video player instance', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"></video>' +
                       '<video id="test_vid_id2"></video>';

  const player = videojs('test_vid_id', { techOrder: ['techFaker'] });

  assert.ok(player, 'created player from tag');
  assert.ok(player.id() === 'test_vid_id');
  assert.ok(
    videojs.getPlayers().test_vid_id === player,
    'added player to global reference'
  );

  const playerAgain = videojs('test_vid_id');

  assert.ok(player === playerAgain, 'did not create a second player from same tag');

  assert.equal(player, playerAgain, 'we did not make a new player');

  const tag2 = document.getElementById('test_vid_id2');
  const player2 = videojs(tag2, { techOrder: ['techFaker'] });

  assert.ok(player2.id() === 'test_vid_id2', 'created player from element');
});

QUnit.test(
  'should log if the supplied element is not included in the DOM',
  function(assert) {
    const origWarnLog = log.warn;
    const fixture = document.getElementById('qunit-fixture');
    const warnLogs = [];

    log.warn = (args) => {
      warnLogs.push(args);
    };

    const vid = document.createElement('video');

    vid.id = 'test_vid_id';
    fixture.appendChild(vid);
    const player = videojs(vid);

    assert.ok(player, 'created player from tag');
    assert.equal(warnLogs.length, 0, 'no warn logs');

    const vid2 = document.createElement('video');

    vid2.id = 'test_vid_id2';
    const player2 = videojs(vid2);

    assert.ok(player2, 'created player from tag');
    assert.equal(warnLogs.length, 1, 'logged a warning');
    assert.equal(
      warnLogs[0],
      'The element supplied is not included in the DOM',
      'logged the right message'
    );

    // should only log warnings on the first creation
    videojs(vid2);
    videojs('test_vid_id2');
    assert.equal(warnLogs.length, 1, 'did not log another warning');

    log.warn = origWarnLog;
  }
);

QUnit.test(
  'should log about already initalized players if options already passed',
  function(assert) {
    const origWarnLog = log.warn;
    const fixture = document.getElementById('qunit-fixture');
    const warnLogs = [];

    log.warn = (args) => {
      warnLogs.push(args);
    };

    fixture.innerHTML += '<video id="test_vid_id"></video>';

    const player = videojs('test_vid_id', { techOrder: ['techFaker'] });

    assert.ok(player, 'created player from tag');
    assert.equal(player.id(), 'test_vid_id', 'player has the right ID');
    assert.equal(warnLogs.length, 0, 'no warn logs');

    const playerAgain = videojs('test_vid_id');

    assert.equal(player, playerAgain, 'did not create a second player from same tag');
    assert.equal(warnLogs.length, 0, 'no warn logs');

    const playerAgainWithOptions = videojs('test_vid_id', { techOrder: ['techFaker'] });

    assert.equal(
      player,
      playerAgainWithOptions,
      'did not create a second player from same tag'
    );
    assert.equal(warnLogs.length, 1, 'logged a warning');
    assert.equal(
      warnLogs[0],
      'Player "test_vid_id" is already initialised. Options will not be applied.',
      'logged the right message'
    );

    log.warn = origWarnLog;
  }
);

QUnit.test('should return a video player instance from el html5 tech', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"></video>' +
                       '<video id="test_vid_id2"></video>';

  const vid = document.querySelector('#test_vid_id');

  const player = videojs(vid);

  assert.ok(player, 'created player from tag');
  assert.ok(player.id() === 'test_vid_id');
  assert.ok(
    videojs.getPlayers().test_vid_id === player,
    'added player to global reference'
  );

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
  assert.ok(
    videojs.getPlayers().test_vid_id === player,
    'added player to global reference'
  );

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
  assert.equal(
    videojs.options.languages[code.toLowerCase()].Hello,
    'Guten Tag',
    'should match'
  );
  assert.deepEqual(
    result,
    videojs.options.languages[code.toLowerCase()],
    'should also match'
  );
});

QUnit.test('should expose plugin functions', function(assert) {
  [
    'registerPlugin',
    'plugin',
    'getPlugins',
    'getPlugin',
    'getPluginVersion'
  ].forEach(name => {
    assert.strictEqual(typeof videojs[name], 'function', `videojs.${name} is a function`);
  });
});

QUnit.test('should expose options and players properties for backward-compatibility', function(assert) {
  assert.ok(typeof videojs.options, 'object', 'options should be an object');
  assert.ok(typeof videojs.players, 'object', 'players should be an object');
});

QUnit.test('should expose DOM functions', function(assert) {
  const methods = [
    'isEl',
    'isTextNode',
    'createEl',
    'hasClass',
    'addClass',
    'removeClass',
    'toggleClass',
    'setAttributes',
    'getAttributes',
    'emptyEl',
    'insertContent',
    'appendContent'
  ];

  methods.forEach(name => {
    assert.strictEqual(typeof videojs[name], 'function', `function videojs.${name}`);
    assert.strictEqual(typeof Dom[name], 'function', `Dom.${name} function exists`);
  });
});

QUnit.test('ingest player div if data-vjs-player attribute is present on video parentNode', function(assert) {
  const fixture = document.querySelector('#qunit-fixture');

  fixture.innerHTML = `
    <div data-vjs-player class="foo">
      <video id="test_vid_id">
        <source src="http://example.com/video.mp4" type="video/mp4"></source>
      </video>
    </div>
  `;

  const playerDiv = document.querySelector('.foo');
  const vid = document.querySelector('#test_vid_id');

  const player = videojs(vid, {
    techOrder: ['html5']
  });

  assert.equal(player.el(), playerDiv, 'we re-used the given div');
  assert.ok(player.hasClass('foo'), 'keeps any classes that were around previously');
});

QUnit.test('ingested player div should not create a new tag for movingMediaElementInDOM', function(assert) {
  const Html5 = videojs.getTech('Html5');
  const oldIS = Html5.isSupported;
  const oldMoving = Html5.prototype.movingMediaElementInDOM;
  const oldCPT = Html5.nativeSourceHandler.canPlayType;
  const fixture = document.querySelector('#qunit-fixture');

  fixture.innerHTML = `
    <div data-vjs-player class="foo">
      <video id="test_vid_id">
        <source src="http://example.com/video.mp4" type="video/mp4"></source>
      </video>
    </div>
  `;
  Html5.prototype.movingMediaElementInDOM = false;
  Html5.isSupported = () => true;
  Html5.nativeSourceHandler.canPlayType = () => true;

  const playerDiv = document.querySelector('.foo');
  const vid = document.querySelector('#test_vid_id');

  const player = videojs(vid, {
    techOrder: ['html5']
  });

  this.clock.tick(1);

  assert.equal(player.el(), playerDiv, 'we re-used the given div');
  assert.equal(player.tech_.el(), vid, 'we re-used the video element');
  assert.ok(player.hasClass('foo'), 'keeps any classes that were around previously');

  Html5.prototype.movingMediaElementInDOM = oldMoving;
  Html5.isSupported = oldIS;
  Html5.nativeSourceHandler.canPlayType = oldCPT;
});

QUnit.test('should create a new tag for movingMediaElementInDOM', function(assert) {
  const Html5 = videojs.getTech('Html5');
  const oldMoving = Html5.prototype.movingMediaElementInDOM;
  const oldCPT = Html5.nativeSourceHandler.canPlayType;
  const fixture = document.querySelector('#qunit-fixture');
  const oldIS = Html5.isSupported;

  fixture.innerHTML = `
    <div class="foo">
      <video id="test_vid_id">
        <source src="http://example.com/video.mp4" type="video/mp4"></source>
      </video>
    </div>
  `;
  Html5.prototype.movingMediaElementInDOM = false;
  Html5.isSupported = () => true;
  Html5.nativeSourceHandler.canPlayType = () => true;

  const playerDiv = document.querySelector('.foo');
  const vid = document.querySelector('#test_vid_id');

  const player = videojs(vid, {
    techOrder: ['html5']
  });

  this.clock.tick(1);

  assert.notEqual(player.el(), playerDiv, 'we used a new div');
  assert.notEqual(player.tech_.el(), vid, 'we a new video element');

  Html5.prototype.movingMediaElementInDOM = oldMoving;
  Html5.isSupported = oldIS;
  Html5.nativeSourceHandler.canPlayType = oldCPT;
});

QUnit.test('getPlayer', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video-js id="test_vid_id"></video-js>';

  assert.notOk(videojs.getPlayer('test_vid_id'), 'no player was created yet');

  const tag = document.querySelector('#test_vid_id');
  const player = videojs(tag);

  assert.strictEqual(videojs.getPlayer('#test_vid_id'), player, 'the player was returned when using a jQuery-style ID selector');
  assert.strictEqual(videojs.getPlayer('test_vid_id'), player, 'the player was returned when using a raw ID value');
  assert.strictEqual(videojs.getPlayer(tag), player, 'the player was returned when using the original tag/element');

  player.dispose();
});

QUnit.test('videojs() works with the tech id', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video-js id="player"></video-js>';

  const tag = document.querySelector('#player');
  const player = videojs('#player', {techOrder: ['html5']});

  assert.strictEqual(videojs('player_html5_api'), player, 'the player was returned for the tech id');
  assert.strictEqual(videojs(tag), player, 'the player was returned when using the original tag/element');

  player.dispose();
});

QUnit.test('getPlayer works with the tech id', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video-js id="player"></video-js>';

  const tag = document.querySelector('#player');
  const player = videojs('#player', {techOrder: ['html5']});

  assert.strictEqual(videojs.getPlayer('player_html5_api'), player, 'the player was returned for the tech id');
  assert.strictEqual(videojs.getPlayer(tag), player, 'the player was returned when using the original tag/element');

  player.dispose();
});

QUnit.test('getAllPlayers', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video id="test_vid_id"></video>' +
                       '<video id="test_vid_id2"></video>';

  let all = videojs.getAllPlayers();

  assert.ok(Array.isArray(all), 'an array was returned');
  assert.strictEqual(all.length, 0, 'the array was empty because no players have been created yet');

  const player = videojs('test_vid_id');
  const player2 = videojs('test_vid_id2');

  all = videojs.getAllPlayers();

  assert.ok(Array.isArray(all), 'an array was returned');
  assert.strictEqual(all.length, 2, 'the array had two items');
  assert.notStrictEqual(all.indexOf(player), -1, 'the first player was in the array');
  assert.notStrictEqual(all.indexOf(player2), -1, 'the second player was in the array');
});

/* **************************************************** *
 * div embed tests copied from video emebed tests above *
 * **************************************************** */
QUnit.module('video.js video-js embed', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
  },
  afterEach() {
    this.clock.restore();
    videojs.getAllPlayers().forEach(p => p.dispose());
  }
});

QUnit.test('should return a video player instance', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video-js id="test_vid_id"></video-js>' +
                       '<video-js id="test_vid_id2"></video-js>';

  const player = videojs('test_vid_id', { techOrder: ['techFaker'] });

  assert.ok(player, 'created player from tag');
  assert.ok(player.id() === 'test_vid_id');
  assert.ok(
    videojs.getPlayers().test_vid_id === player,
    'added player to global reference'
  );

  const playerAgain = videojs('test_vid_id');

  assert.ok(player === playerAgain, 'did not create a second player from same tag');

  assert.equal(player, playerAgain, 'we did not make a new player');

  const tag2 = document.getElementById('test_vid_id2');
  const player2 = videojs(tag2, { techOrder: ['techFaker'] });

  assert.ok(player2.id() === 'test_vid_id2', 'created player from element');
});

QUnit.test('should add video-js class to video-js embed if missing', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video-js id="test_vid_id"></video-js>' +
                       '<video-js id="test_vid_id2" class="foo"></video-js>';

  const player = videojs('test_vid_id', { techOrder: ['techFaker'] });

  assert.ok(player, 'created player from tag');
  assert.ok(player.id() === 'test_vid_id');
  assert.ok(player.hasClass('video-js'), 'we have the video-js class');

  const tag2 = document.getElementById('test_vid_id2');
  const player2 = videojs(tag2, { techOrder: ['techFaker'] });

  assert.ok(player2.id() === 'test_vid_id2', 'created player from element');
  assert.ok(player2.hasClass('video-js'), 'we have the video-js class');
  assert.ok(player2.hasClass('foo'), 'we have the foo class');
});

QUnit.test(
  'should log about already initalized players if options already passed',
  function(assert) {
    const origWarnLog = log.warn;
    const fixture = document.getElementById('qunit-fixture');
    const warnLogs = [];

    log.warn = (args) => {
      warnLogs.push(args);
    };

    fixture.innerHTML += '<video-js id="test_vid_id"></video-js>';

    const player = videojs('test_vid_id', { techOrder: ['techFaker'] });

    assert.ok(player, 'created player from tag');
    assert.equal(player.id(), 'test_vid_id', 'player has the right ID');
    assert.equal(warnLogs.length, 0, 'no warn logs');

    const playerAgain = videojs('test_vid_id');

    assert.equal(player, playerAgain, 'did not create a second player from same tag');
    assert.equal(warnLogs.length, 0, 'no warn logs');

    const playerAgainWithOptions = videojs('test_vid_id', { techOrder: ['techFaker'] });

    assert.equal(
      player,
      playerAgainWithOptions,
      'did not create a second player from same tag'
    );
    assert.equal(warnLogs.length, 1, 'logged a warning');
    assert.equal(
      warnLogs[0],
      'Player "test_vid_id" is already initialised. Options will not be applied.',
      'logged the right message'
    );

    log.warn = origWarnLog;
  }
);

QUnit.test('should return a video player instance from el html5 tech', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video-js id="test_vid_id"></video-js>' +
                       '<video-js id="test_vid_id2"></video-js>';

  const vid = document.querySelector('#test_vid_id');

  const player = videojs(vid);

  assert.ok(player, 'created player from tag');
  assert.ok(player.id() === 'test_vid_id');
  assert.ok(
    videojs.getPlayers().test_vid_id === player,
    'added player to global reference'
  );

  const playerAgain = videojs(vid);

  assert.ok(player === playerAgain, 'did not create a second player from same tag');
  assert.equal(player, playerAgain, 'we did not make a new player');

  const tag2 = document.getElementById('test_vid_id2');
  const player2 = videojs(tag2, { techOrder: ['techFaker'] });

  assert.ok(player2.id() === 'test_vid_id2', 'created player from element');
});

QUnit.test('should return a video player instance from el techfaker', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video-js id="test_vid_id"></video-js>' +
                       '<video-js id="test_vid_id2"></video-js>';

  const vid = document.querySelector('#test_vid_id');
  const player = videojs(vid, {techOrder: ['techFaker']});

  assert.ok(player, 'created player from tag');
  assert.ok(player.id() === 'test_vid_id');
  assert.ok(
    videojs.getPlayers().test_vid_id === player,
    'added player to global reference'
  );

  const playerAgain = videojs(vid);

  assert.ok(player === playerAgain, 'did not create a second player from same tag');
  assert.equal(player, playerAgain, 'we did not make a new player');

  const tag2 = document.getElementById('test_vid_id2');
  const player2 = videojs(tag2, { techOrder: ['techFaker'] });

  assert.ok(player2.id() === 'test_vid_id2', 'created player from element');
});

QUnit.test('adds video-js class name with the video-js embed', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += '<video-js id="test_vid_id"></video-js>' +
                       '<video-js class="video-js" id="test_vid_id2"></video-js>';

  const vid = document.querySelector('#test_vid_id');
  const player = videojs(vid, {techOrder: ['techFaker']});
  const tag2 = document.getElementById('test_vid_id2');
  const player2 = videojs(tag2, { techOrder: ['techFaker'] });

  assert.ok(player.hasClass('video-js'), 'video-js class was added to the first embed');
  assert.ok(player2.hasClass('video-js'), 'video-js class was preserved to the second embed');
});
