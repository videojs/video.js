/* eslint-env qunit */
import Player from '../../src/js/player.js';
import videojs from '../../src/js/video.js';
import * as Dom from '../../src/js/utils/dom.js';
import * as browser from '../../src/js/utils/browser.js';
import log from '../../src/js/utils/log.js';
import MediaError from '../../src/js/media-error.js';
import Html5 from '../../src/js/tech/html5.js';
import TestHelpers from './test-helpers.js';
import document from 'global/document';
import sinon from 'sinon';
import window from 'global/window';
import Tech from '../../src/js/tech/tech.js';
import TechFaker from './tech/tech-faker.js';

QUnit.module('Player', {
  beforeEach() {
    this.clock = sinon.useFakeTimers();
  },
  afterEach() {
    this.clock.restore();
  }
});

QUnit.test('should create player instance that inherits from component and dispose it', function(assert) {
  const player = TestHelpers.makePlayer();

  assert.ok(player.el().nodeName === 'DIV');
  assert.ok(player.on, 'component function exists');

  player.dispose();
  assert.ok(player.el() === null, 'element disposed');
});

QUnit.test('dispose should not throw if styleEl is missing', function(assert) {
  const player = TestHelpers.makePlayer();

  player.styleEl_.parentNode.removeChild(player.styleEl_);

  player.dispose();
  assert.ok(player.el() === null, 'element disposed');
});

// technically, all uses of videojs.options should be replaced with
// Player.prototype.options_ in this file and a equivalent test using
// videojs.options should be made in video.test.js. Keeping this here
// until we make that move.
QUnit.test('should accept options from multiple sources and override in correct order', function(assert) {

  // Set a global option
  videojs.options.attr = 1;

  const tag0 = TestHelpers.makeTag();
  const player0 = new Player(tag0, { techOrder: ['techFaker'] });

  assert.equal(player0.options_.attr, 1, 'global option was set');
  player0.dispose();

  // Set a tag level option
  const tag2 = TestHelpers.makeTag();

  // Attributes must be set as strings
  tag2.setAttribute('attr', 'asdf');

  const player2 = new Player(tag2, { techOrder: ['techFaker'] });

  assert.equal(player2.options_.attr, 'asdf', 'Tag options overrode global options');
  player2.dispose();

  // Set a tag level option
  const tag3 = TestHelpers.makeTag();

  tag3.setAttribute('attr', 'asdf');

  const player3 = new Player(tag3, { techOrder: ['techFaker'], attr: 'fdsa' });

  assert.equal(player3.options_.attr, 'fdsa', 'Init options overrode tag and global options');
  player3.dispose();
});

QUnit.test('should get tag, source, and track settings', function(assert) {
  // Partially tested in lib->getElAttributes

  const fixture = document.getElementById('qunit-fixture');

  let html = '<video id="example_1" class="video-js" autoplay preload="none">';

  html += '<source src="http://google.com" type="video/mp4">';
  html += '<source src="http://google.com" type="video/webm">';
  html += '<track kind="captions" attrtest>';
  html += '</video>';

  fixture.innerHTML += html;

  const tag = document.getElementById('example_1');
  const player = TestHelpers.makePlayer({}, tag);

  assert.equal(player.options_.autoplay, true, 'autoplay is set to true');
  assert.equal(player.options_.preload, 'none', 'preload is set to none');
  assert.equal(player.options_.id, 'example_1', 'id is set to example_1');
  assert.equal(player.options_.sources.length, 2, 'we have two sources');
  assert.equal(player.options_.sources[0].src, 'http://google.com', 'first source is google.com');
  assert.equal(player.options_.sources[0].type, 'video/mp4', 'first time is video/mp4');
  assert.equal(player.options_.sources[1].type, 'video/webm', 'second type is video/webm');
  assert.equal(player.options_.tracks.length, 1, 'we have one text track');
  assert.equal(player.options_.tracks[0].kind, 'captions', 'the text track is a captions file');
  assert.equal(player.options_.tracks[0].attrtest, '', 'we have an empty attribute called attrtest');

  assert.notEqual(player.el().className.indexOf('video-js'), -1, 'transferred class from tag to player div');
  assert.equal(player.el().id, 'example_1', 'transferred id from tag to player div');

  assert.equal(Player.players[player.id()], player, 'player referenceable from global list');
  assert.notEqual(tag.id, player.id, 'tag ID no longer is the same as player ID');
  assert.notEqual(tag.className, player.el().className, 'tag classname updated');

  player.dispose();

  assert.notEqual(tag.player, player, 'tag player ref killed');
  assert.ok(!Player.players.example_1, 'global player ref killed');
  assert.equal(player.el(), null, 'player el killed');
});

QUnit.test('should asynchronously fire error events during source selection', function(assert) {
  assert.expect(2);

  sinon.stub(log, 'error');

  const player = TestHelpers.makePlayer({
    techOrder: ['foo'],
    sources: [
      { src: 'http://vjs.zencdn.net/v/oceans.mp4', type: 'video/mp4' }
    ]
  });

  assert.ok(player.options_.techOrder[0] === 'foo', 'Foo listed as the only tech');

  player.on('error', function(e) {
    assert.ok(player.error().code === 4, 'Source could not be played error thrown');
  });

  this.clock.tick(1);

  player.dispose();
  log.error.restore();
});

QUnit.test('should set the width, height, and aspect ratio via a css class', function(assert) {
  const player = TestHelpers.makePlayer();
  const getStyleText = function(styleEl) {
    return (styleEl.styleSheet && styleEl.styleSheet.cssText) || styleEl.innerHTML;
  };

  // NOTE: was using npm/css to parse the actual CSS ast
  // but the css module doesn't support ie8
  const confirmSetting = function(prop, val) {
    let styleText = getStyleText(player.styleEl_);
    const re = new RegExp(prop + ':\\s?' + val);

    // Lowercase string for IE8
    styleText = styleText.toLowerCase();

    return !!re.test(styleText);
  };

  // Initial state
  assert.ok(!getStyleText(player.styleEl_), 'style element should be empty when the player is given no dimensions');

  // Set only the width
  player.width(100);
  assert.ok(confirmSetting('width', '100px'), 'style width should equal the supplied width in pixels');
  assert.ok(confirmSetting('height', '56.25px'), 'style height should match the default aspect ratio of the width');

  // Set the height
  player.height(200);
  assert.ok(confirmSetting('height', '200px'), 'style height should match the supplied height in pixels');

  // Reset the width and height to defaults
  player.width('');
  player.height('');
  assert.ok(confirmSetting('width', '300px'), 'supplying an empty string should reset the width');
  assert.ok(confirmSetting('height', '168.75px'), 'supplying an empty string should reset the height');

  // Switch to fluid mode
  player.fluid(true);
  assert.ok(player.hasClass('vjs-fluid'), 'the vjs-fluid class should be added to the player');
  assert.ok(confirmSetting('padding-top', '56.25%'), 'fluid aspect ratio should match the default aspect ratio');

  // Change the aspect ratio
  player.aspectRatio('4:1');
  assert.ok(confirmSetting('padding-top', '25%'), 'aspect ratio percent should match the newly set aspect ratio');
  player.dispose();
});

QUnit.test('should use an class name that begins with an alpha character', function(assert) {
  const alphaPlayer = TestHelpers.makePlayer({ id: 'alpha1' });
  const numericPlayer = TestHelpers.makePlayer({ id: '1numeric' });

  const getStyleText = function(styleEl) {
    return (styleEl.styleSheet && styleEl.styleSheet.cssText) || styleEl.innerHTML;
  };

  alphaPlayer.width(100);
  numericPlayer.width(100);

  assert.ok(/\s*\.alpha1-dimensions\s*\{/.test(getStyleText(alphaPlayer.styleEl_)), 'appends -dimensions to an alpha player ID');
  assert.ok(/\s*\.dimensions-1numeric\s*\{/.test(getStyleText(numericPlayer.styleEl_)), 'prepends dimensions- to a numeric player ID');
  alphaPlayer.dispose();
  numericPlayer.dispose();
});

QUnit.test('should wrap the original tag in the player div', function(assert) {
  const tag = TestHelpers.makeTag();
  const container = document.createElement('div');
  const fixture = document.getElementById('qunit-fixture');

  container.appendChild(tag);
  fixture.appendChild(container);

  const player = new Player(tag, { techOrder: ['techFaker'] });
  const el = player.el();

  assert.ok(el.parentNode === container, 'player placed at same level as tag');
  // Tag may be placed inside the player element or it may be removed from the DOM
  assert.ok(tag.parentNode !== container, 'tag removed from original place');

  player.dispose();
});

QUnit.test('should set and update the poster value', function(assert) {
  const poster = '#';
  const updatedPoster = 'http://example.com/updated-poster.jpg';

  const tag = TestHelpers.makeTag();

  tag.setAttribute('poster', poster);

  const player = TestHelpers.makePlayer({}, tag);

  assert.equal(player.poster(), poster, 'the poster property should equal the tag attribute');

  let pcEmitted = false;

  player.on('posterchange', function() {
    pcEmitted = true;
  });

  player.poster(updatedPoster);
  assert.ok(pcEmitted, 'posterchange event was emitted');
  assert.equal(player.poster(), updatedPoster, 'the updated poster is returned');

  player.dispose();
});

// hasStarted() is equivalent to the "show poster flag" in the
// standard, for the purpose of displaying the poster image
// https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-play
QUnit.test('should hide the poster when play is called', function(assert) {
  const player = TestHelpers.makePlayer({
    poster: 'https://example.com/poster.jpg'
  });

  assert.equal(player.hasStarted(), false, 'the show poster flag is true before play');
  player.tech_.trigger('play');
  assert.equal(player.hasStarted(), true, 'the show poster flag is false after play');

  player.tech_.trigger('loadstart');
  assert.equal(player.hasStarted(), false, 'the resource selection algorithm sets the show poster flag to true');

  player.tech_.trigger('play');
  assert.equal(player.hasStarted(), true, 'the show poster flag is false after play');
  player.dispose();
});

QUnit.test('should load a media controller', function(assert) {
  const player = TestHelpers.makePlayer({
    preload: 'none',
    sources: [
      { src: 'http://google.com', type: 'video/mp4' },
      { src: 'http://google.com', type: 'video/webm' }
    ]
  });

  assert.ok(player.el().children[0].className.indexOf('vjs-tech') !== -1, 'media controller loaded');

  player.dispose();
});

QUnit.test('should be able to initialize player twice on the same tag using string reference', function(assert) {
  let videoTag = TestHelpers.makeTag();
  const id = videoTag.id;

  const fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(videoTag);

  let player = videojs(videoTag.id, { techOrder: ['techFaker'] });

  assert.ok(player, 'player is created');
  player.dispose();

  assert.ok(!document.getElementById(id), 'element is removed');
  videoTag = TestHelpers.makeTag();
  fixture.appendChild(videoTag);

  // here we receive cached version instead of real
  player = videojs(videoTag.id, { techOrder: ['techFaker'] });
  // here it triggers error, because player was destroyed already after first dispose
  player.dispose();
});

QUnit.test('should set controls and trigger events', function(assert) {
  const player = TestHelpers.makePlayer({ controls: false });

  assert.ok(player.controls() === false, 'controls set through options');
  const hasDisabledClass = player.el().className.indexOf('vjs-controls-disabled');

  assert.ok(hasDisabledClass !== -1, 'Disabled class added to player');

  player.controls(true);
  assert.ok(player.controls() === true, 'controls updated');
  const hasEnabledClass = player.el().className.indexOf('vjs-controls-enabled');

  assert.ok(hasEnabledClass !== -1, 'Disabled class added to player');

  player.on('controlsenabled', function() {
    assert.ok(true, 'enabled fired once');
  });
  player.on('controlsdisabled', function() {
    assert.ok(true, 'disabled fired once');
  });
  player.controls(false);

  player.dispose();
});

QUnit.test('should toggle user the user state between active and inactive', function(assert) {
  const player = TestHelpers.makePlayer({});

  assert.expect(9);

  assert.ok(player.userActive(), 'User should be active at player init');

  player.on('userinactive', function() {
    assert.ok(true, 'userinactive event triggered');
  });

  player.on('useractive', function() {
    assert.ok(true, 'useractive event triggered');
  });

  player.userActive(false);
  assert.ok(player.userActive() === false, 'Player state changed to inactive');
  assert.ok(player.el().className.indexOf('vjs-user-active') === -1, 'Active class removed');
  assert.ok(player.el().className.indexOf('vjs-user-inactive') !== -1, 'Inactive class added');

  player.userActive(true);
  assert.ok(player.userActive() === true, 'Player state changed to active');
  assert.ok(player.el().className.indexOf('vjs-user-inactive') === -1, 'Inactive class removed');
  assert.ok(player.el().className.indexOf('vjs-user-active') !== -1, 'Active class added');

  player.dispose();
});

QUnit.test('should add a touch-enabled classname when touch is supported', function(assert) {
  assert.expect(1);

  // Fake touch support. Real touch support isn't needed for this test.
  const origTouch = browser.TOUCH_ENABLED;

  browser.TOUCH_ENABLED = true;

  const player = TestHelpers.makePlayer({});

  assert.ok(player.el().className.indexOf('vjs-touch-enabled'), 'touch-enabled classname added');

  browser.TOUCH_ENABLED = origTouch;
  player.dispose();
});

QUnit.test('should allow for tracking when native controls are used', function(assert) {
  const player = TestHelpers.makePlayer({});

  assert.expect(6);

  // Make sure native controls is false before starting test
  player.usingNativeControls(false);

  player.on('usingnativecontrols', function() {
    assert.ok(true, 'usingnativecontrols event triggered');
  });

  player.on('usingcustomcontrols', function() {
    assert.ok(true, 'usingcustomcontrols event triggered');
  });

  player.usingNativeControls(true);
  assert.ok(player.usingNativeControls() === true, 'Using native controls is true');
  assert.ok(player.el().className.indexOf('vjs-using-native-controls') !== -1, 'Native controls class added');

  player.usingNativeControls(false);
  assert.ok(player.usingNativeControls() === false, 'Using native controls is false');
  assert.ok(player.el().className.indexOf('vjs-using-native-controls') === -1, 'Native controls class removed');

  player.dispose();
});

QUnit.test('make sure that controls listeners do not get added too many times', function(assert) {
  const player = TestHelpers.makePlayer({});
  let listeners = 0;

  player.addTechControlsListeners_ = function() {
    listeners++;
  };

  // Make sure native controls is false before starting test
  player.usingNativeControls(false);

  player.usingNativeControls(true);

  player.controls(true);

  assert.equal(listeners, 0, 'addTechControlsListeners_ should not have gotten called yet');

  player.usingNativeControls(false);
  player.controls(false);

  player.controls(true);
  assert.equal(listeners, 1, 'addTechControlsListeners_ should have gotten called once');

  player.dispose();
});

QUnit.test('should select the proper tech based on the the sourceOrder option', function(assert) {
  const fixture = document.getElementById('qunit-fixture');
  const html =
        '<video id="example_1">' +
          '<source src="fake.foo1" type="video/unsupported-format">' +
          '<source src="fake.foo2" type="video/foo-format">' +
        '</video>';

  // Extend TechFaker to create a tech that plays the only mime-type that TechFaker
  // will not play
  class PlaysUnsupported extends TechFaker {
    constructor(options, handleReady) {
      super(options, handleReady);
    }
    // Support ONLY "video/unsupported-format"
    static isSupported() {
      return true;
    }
    static canPlayType(type) {
      return (type === 'video/unsupported-format' ? 'maybe' : '');
    }
    static canPlaySource(srcObj) {
      return srcObj.type === 'video/unsupported-format';
    }
    }
  Tech.registerTech('PlaysUnsupported', PlaysUnsupported);

  fixture.innerHTML += html;
  let tag = document.getElementById('example_1');

  let player = new Player(tag, { techOrder: ['techFaker', 'playsUnsupported'], sourceOrder: true });

  assert.equal(player.techName_, 'PlaysUnsupported', 'selected the PlaysUnsupported tech when sourceOrder is truthy');
  player.dispose();

  fixture.innerHTML += html;
  tag = document.getElementById('example_1');

  player = new Player(tag, { techOrder: ['techFaker', 'playsUnsupported']});
  assert.equal(player.techName_, 'TechFaker', 'selected the TechFaker tech when sourceOrder is falsey');
  player.dispose();
});

QUnit.test('should register players with generated ids', function(assert) {
  const fixture = document.getElementById('qunit-fixture');

  const video = document.createElement('video');

  video.className = 'vjs-default-skin video-js';
  fixture.appendChild(video);

  const player = new Player(video, { techOrder: ['techFaker'] });
  const id = player.el().id;

  assert.equal(player.el().id, player.id(), 'the player and element ids are equal');
  assert.ok(Player.players[id], 'the generated id is registered');
  player.dispose();
});

QUnit.test('should not add multiple first play events despite subsequent loads', function(assert) {
  assert.expect(1);

  const player = TestHelpers.makePlayer({});

  player.on('firstplay', function() {
    assert.ok(true, 'First play should fire once.');
  });

  // Checking to make sure onLoadStart removes first play listener before adding a new one.
  player.tech_.trigger('loadstart');
  player.tech_.trigger('loadstart');
  player.tech_.trigger('play');
  player.dispose();
});

QUnit.test('should fire firstplay after resetting the player', function(assert) {
  const player = TestHelpers.makePlayer({});

  let fpFired = false;

  player.on('firstplay', function() {
    fpFired = true;
  });

  // init firstplay listeners
  player.tech_.trigger('loadstart');
  player.tech_.trigger('play');
  assert.ok(fpFired, 'First firstplay fired');

  // reset the player
  player.tech_.trigger('loadstart');
  fpFired = false;
  player.tech_.trigger('play');
  assert.ok(fpFired, 'Second firstplay fired');

  // the play event can fire before the loadstart event.
  // in that case we still want the firstplay even to fire.
  player.tech_.paused = function() {
    return false;
  };
  fpFired = false;
  // reset the player
  player.tech_.trigger('loadstart');
  // player.tech_.trigger('play');
  assert.ok(fpFired, 'Third firstplay fired');
  player.dispose();
});

QUnit.test('should remove vjs-has-started class', function(assert) {
  assert.expect(3);

  const player = TestHelpers.makePlayer({});

  player.tech_.trigger('loadstart');
  player.tech_.trigger('play');
  assert.ok(player.el().className.indexOf('vjs-has-started') !== -1, 'vjs-has-started class added');

  player.tech_.trigger('loadstart');
  assert.ok(player.el().className.indexOf('vjs-has-started') === -1, 'vjs-has-started class removed');

  player.tech_.trigger('play');

  assert.ok(player.el().className.indexOf('vjs-has-started') !== -1, 'vjs-has-started class added again');
  player.dispose();
});

QUnit.test('should add and remove vjs-ended class', function(assert) {
  assert.expect(4);

  const player = TestHelpers.makePlayer({});

  player.tech_.trigger('loadstart');
  player.tech_.trigger('play');
  player.tech_.trigger('ended');
  assert.ok(player.el().className.indexOf('vjs-ended') !== -1, 'vjs-ended class added');

  player.tech_.trigger('play');
  assert.ok(player.el().className.indexOf('vjs-ended') === -1, 'vjs-ended class removed');

  player.tech_.trigger('ended');
  assert.ok(player.el().className.indexOf('vjs-ended') !== -1, 'vjs-ended class re-added');

  player.tech_.trigger('loadstart');
  assert.ok(player.el().className.indexOf('vjs-ended') === -1, 'vjs-ended class removed');
  player.dispose();
});

QUnit.test('player should handle different error types', function(assert) {
  assert.expect(8);
  const player = TestHelpers.makePlayer({});
  const testMsg = 'test message';

  // prevent error log messages in the console
  sinon.stub(log, 'error');

  // error code supplied
  function errCode() {
    assert.equal(player.error().code, 1, 'error code is correct');
  }
  player.on('error', errCode);
  player.error(1);
  player.off('error', errCode);

  // error instance supplied
  function errInst() {
    assert.equal(player.error().code, 2, 'MediaError code is correct');
    assert.equal(player.error().message, testMsg, 'MediaError message is correct');
  }
  player.on('error', errInst);
  player.error(new MediaError({ code: 2, message: testMsg }));
  player.off('error', errInst);

  // error message supplied
  function errMsg() {
    assert.equal(player.error().code, 0, 'error message code is correct');
    assert.equal(player.error().message, testMsg, 'error message is correct');
  }
  player.on('error', errMsg);
  player.error(testMsg);
  player.off('error', errMsg);

  // error config supplied
  function errConfig() {
    assert.equal(player.error().code, 3, 'error config code is correct');
    assert.equal(player.error().message, testMsg, 'error config message is correct');
  }
  player.on('error', errConfig);
  player.error({ code: 3, message: testMsg });
  player.off('error', errConfig);

  // check for vjs-error classname
  assert.ok(player.el().className.indexOf('vjs-error') >= 0, 'player does not have vjs-error classname');

  // restore error logging
  log.error.restore();

  player.dispose();
});

QUnit.test('Data attributes on the video element should persist in the new wrapper element', function(assert) {
  const dataId = 123;

  const tag = TestHelpers.makeTag();

  tag.setAttribute('data-id', dataId);

  const player = TestHelpers.makePlayer({}, tag);

  assert.equal(player.el().getAttribute('data-id'), dataId, 'data-id should be available on the new player element after creation');

  player.dispose();
});

QUnit.test('should restore attributes from the original video tag when creating a new element', function(assert) {
  // simulate attributes stored from the original tag
  const tag = Dom.createEl('video');

  tag.setAttribute('preload', 'auto');
  tag.setAttribute('autoplay', '');
  tag.setAttribute('webkit-playsinline', '');

  const html5Mock = { options_: {tag} };

  // set options that should override tag attributes
  html5Mock.options_.preload = 'none';

  // create the element
  const el = Html5.prototype.createEl.call(html5Mock);

  assert.equal(el.getAttribute('preload'), 'none', 'attribute was successful overridden by an option');
  assert.equal(el.getAttribute('autoplay'), '', 'autoplay attribute was set properly');
  assert.equal(el.getAttribute('webkit-playsinline'), '', 'webkit-playsinline attribute was set properly');
});

QUnit.test('should honor default inactivity timeout', function(assert) {
  const clock = sinon.useFakeTimers();

  // default timeout is 2000ms
  const player = TestHelpers.makePlayer({});

  assert.equal(player.userActive(), true, 'User is active on creation');
  clock.tick(1800);
  assert.equal(player.userActive(), true, 'User is still active');
  clock.tick(500);
  assert.equal(player.userActive(), false, 'User is inactive after timeout expired');

  clock.restore();
  player.dispose();
});

QUnit.test('should honor configured inactivity timeout', function(assert) {
  const clock = sinon.useFakeTimers();

  // default timeout is 2000ms, set to shorter 200ms
  const player = TestHelpers.makePlayer({
    inactivityTimeout: 200
  });

  assert.equal(player.userActive(), true, 'User is active on creation');
  clock.tick(150);
  assert.equal(player.userActive(), true, 'User is still active');
  clock.tick(350);
  // make sure user is now inactive after 500ms
  assert.equal(player.userActive(), false, 'User is inactive after timeout expired');

  clock.restore();
  player.dispose();
});

QUnit.test('should honor disabled inactivity timeout', function(assert) {
  const clock = sinon.useFakeTimers();

  // default timeout is 2000ms, disable by setting to zero
  const player = TestHelpers.makePlayer({
    inactivityTimeout: 0
  });

  assert.equal(player.userActive(), true, 'User is active on creation');
  clock.tick(5000);
  assert.equal(player.userActive(), true, 'User is still active');

  clock.restore();
  player.dispose();
});

QUnit.test('should clear pending errors on disposal', function(assert) {
  const clock = sinon.useFakeTimers();

  const player = TestHelpers.makePlayer();

  player.src({
    src: 'http://example.com/movie.unsupported-format',
    type: 'video/unsupported-format'
  });
  player.dispose();
  try {
    clock.tick(5000);
  } catch (e) {
    return assert.ok(!e, 'threw an error: ' + e.message);
  }
  assert.ok(true, 'did not throw an error after disposal');
});

QUnit.test('pause is called when player ended event is fired and player is not paused', function(assert) {
  const video = document.createElement('video');
  const player = TestHelpers.makePlayer({}, video);
  let pauses = 0;

  player.paused = function() {
    return false;
  };
  player.pause = function() {
    pauses++;
  };
  player.tech_.trigger('ended');
  assert.equal(pauses, 1, 'pause was called');
  player.dispose();
});

QUnit.test('pause is not called if the player is paused and ended is fired', function(assert) {
  const video = document.createElement('video');
  const player = TestHelpers.makePlayer({}, video);
  let pauses = 0;

  player.paused = function() {
    return true;
  };
  player.pause = function() {
    pauses++;
  };
  player.tech_.trigger('ended');

  assert.equal(pauses, 0, 'pause was not called when ended fired');
  player.dispose();
});

QUnit.test('should add an audio class if an audio el is used', function(assert) {
  const audio = document.createElement('audio');
  const player = TestHelpers.makePlayer({}, audio);
  const audioClass = 'vjs-audio';

  assert.ok(player.el().className.indexOf(audioClass) !== -1, 'added ' + audioClass + ' css class');
  player.dispose();
});

QUnit.test('should add a video player region if a video el is used', function(assert) {
  const video = document.createElement('video');
  const player = TestHelpers.makePlayer({}, video);

  assert.ok(player.el().getAttribute('role') === 'region', 'region role is present');
  assert.ok(player.el().getAttribute('aria-label') === 'video player', 'video player label present');
  player.dispose();
});

QUnit.test('should add an audio player region if an audio el is used', function(assert) {
  const audio = document.createElement('audio');
  const player = TestHelpers.makePlayer({}, audio);

  assert.ok(player.el().getAttribute('role') === 'region', 'region role is present');
  assert.ok(player.el().getAttribute('aria-label') === 'audio player', 'audio player label present');
  player.dispose();
});

QUnit.test('should not be scrubbing while not seeking', function(assert) {
  const player = TestHelpers.makePlayer();

  assert.equal(player.scrubbing(), false, 'player is not scrubbing');
  assert.ok(player.el().className.indexOf('scrubbing') === -1, 'scrubbing class is not present');
  player.scrubbing(false);

  assert.equal(player.scrubbing(), false, 'player is not scrubbing');
  player.dispose();
});

QUnit.test('should be scrubbing while seeking', function(assert) {
  const player = TestHelpers.makePlayer();

  player.scrubbing(true);
  assert.equal(player.scrubbing(), true, 'player is scrubbing');
  assert.ok(player.el().className.indexOf('scrubbing') !== -1, 'scrubbing class is present');
  player.dispose();
});

QUnit.test('should throw on startup no techs are specified', function(assert) {
  const techOrder = videojs.options.techOrder;

  videojs.options.techOrder = null;
  assert.throws(function() {
    videojs(TestHelpers.makeTag());
  }, 'a falsey techOrder should throw');

  videojs.options.techOrder = techOrder;
});

QUnit.test('should have a sensible toJSON that is equivalent to player.options', function(assert) {
  const playerOptions = {
    html5: {
      nativeTextTracks: false
    }
  };

  const player = TestHelpers.makePlayer(playerOptions);

  assert.deepEqual(player.toJSON(), player.options_, 'simple player options toJSON produces output equivalent to player.options_');

  const playerOptions2 = {
    tracks: [{
      label: 'English',
      srclang: 'en',
      src: '../docs/examples/shared/example-captions.vtt',
      kind: 'captions'
    }]
  };

  const player2 = TestHelpers.makePlayer(playerOptions2);

  playerOptions2.tracks[0].player = player2;

  const popts = player2.options_;

  popts.tracks[0].player = undefined;

  assert.deepEqual(player2.toJSON(), popts, 'no circular references');

  player.dispose();
  player2.dispose();
});

QUnit.test('should ignore case in language codes and try primary code', function(assert) {
  assert.expect(3);

  const player = TestHelpers.makePlayer({
    languages: {
      'en-gb': {
        Good: 'Brilliant'
      },
      'EN': {
        Good: 'Awesome',
        Error: 'Problem'
      }
    }
  });

  player.language('en-gb');
  assert.strictEqual(player.localize('Good'), 'Brilliant', 'Used subcode specific localisation');
  assert.strictEqual(player.localize('Error'), 'Problem', 'Used primary code localisation');
  player.language('en-GB');
  assert.strictEqual(player.localize('Good'), 'Brilliant', 'Ignored case');
  player.dispose();
});

QUnit.test('inherits language from parent element', function(assert) {
  const fixture = document.getElementById('qunit-fixture');
  const oldLang = fixture.getAttribute('lang');

  fixture.setAttribute('lang', 'x-test');
  const player = TestHelpers.makePlayer();

  assert.equal(player.language(), 'x-test', 'player inherits parent element language');

  player.dispose();
  if (oldLang) {
    fixture.setAttribute('lang', oldLang);
  } else {
    fixture.removeAttribute('lang');
  }
});

QUnit.test('should return correct values for canPlayType', function(assert) {
  const player = TestHelpers.makePlayer();

  assert.equal(player.canPlayType('video/mp4'), 'maybe', 'player can play mp4 files');
  assert.equal(player.canPlayType('video/unsupported-format'), '', 'player can not play unsupported files');

  player.dispose();
});

QUnit.test('createModal()', function(assert) {
  const player = TestHelpers.makePlayer();
  const modal = player.createModal('foo');
  const spy = sinon.spy();

  modal.on('dispose', spy);

  assert.expect(5);
  assert.strictEqual(modal.el().parentNode, player.el(), 'the modal is injected into the player');
  assert.strictEqual(modal.content(), 'foo', 'content is set properly');
  assert.ok(modal.opened(), 'modal is opened by default');
  modal.close();

  assert.ok(spy.called, 'modal was disposed when closed');
  assert.strictEqual(player.children().indexOf(modal), -1, 'modal was removed from player\'s children');
  player.dispose();
});

QUnit.test('createModal() options object', function(assert) {
  const player = TestHelpers.makePlayer();
  const modal = player.createModal('foo', {content: 'bar', label: 'boo'});

  assert.expect(2);
  assert.strictEqual(modal.content(), 'foo', 'content argument takes precedence');
  assert.strictEqual(modal.options_.label, 'boo', 'modal options are set properly');
  modal.close();
  player.dispose();
});

QUnit.test('you can clear error in the error event', function(assert) {
  const player = TestHelpers.makePlayer();

  sinon.stub(log, 'error');

  player.error({code: 4});
  assert.ok(player.error(), 'we have an error');
  player.error(null);

  player.one('error', function() {
    player.error(null);
  });
  player.error({code: 4});
  assert.ok(!player.error(), 'we no longer have an error');

  log.error.restore();
  player.dispose();
});

QUnit.test('Player#tech will return tech given the appropriate input', function(assert) {
  const tech_ = {};
  const returnedTech = Player.prototype.tech.call({tech_}, {IWillNotUseThisInPlugins: true});

  assert.equal(returnedTech, tech_, 'We got back the tech we wanted');
});

QUnit.test('Player#tech alerts and throws without the appropriate input', function(assert) {
  let alertCalled;
  const oldAlert = window.alert;

  window.alert = () => {
    alertCalled = true;
  };

  const tech_ = {};

  assert.throws(function() {
    Player.prototype.tech.call({tech_});
  }, new RegExp('https://github.com/videojs/video.js/issues/2617'),
  'we threw an error');

  assert.ok(alertCalled, 'we called an alert');
  window.alert = oldAlert;
});

QUnit.test('player#reset loads the Html5 tech and then techCalls reset', function(assert) {
  let loadedTech;
  let loadedSource;
  let techCallMethod;

  const testPlayer = {
    options_: {
      techOrder: ['html5', 'flash']
    },
    loadTech_(tech, source) {
      loadedTech = tech;
      loadedSource = source;
    },
    techCall_(method) {
      techCallMethod = method;
    }
  };

  Player.prototype.reset.call(testPlayer);

  assert.equal(loadedTech, 'Html5', 'we loaded the html5 tech');
  assert.equal(loadedSource, null, 'with a null source');
  assert.equal(techCallMethod, 'reset', 'we then reset the tech');
});

QUnit.test('player#reset loads the first item in the techOrder and then techCalls reset', function(assert) {
  let loadedTech;
  let loadedSource;
  let techCallMethod;

  const testPlayer = {
    options_: {
      techOrder: ['flash', 'html5']
    },
    loadTech_(tech, source) {
      loadedTech = tech;
      loadedSource = source;
    },
    techCall_(method) {
      techCallMethod = method;
    }
  };

  Player.prototype.reset.call(testPlayer);

  assert.equal(loadedTech, 'Flash', 'we loaded the Flash tech');
  assert.equal(loadedSource, null, 'with a null source');
  assert.equal(techCallMethod, 'reset', 'we then reset the tech');
});

QUnit.test('Remove waiting class on timeupdate after tech waiting', function(assert) {
  const player = TestHelpers.makePlayer();

  player.tech_.trigger('waiting');
  assert.ok(/vjs-waiting/.test(player.el().className), 'vjs-waiting is added to the player el on tech waiting');
  player.trigger('timeupdate');
  assert.ok(!(/vjs-waiting/).test(player.el().className), 'vjs-waiting is removed from the player el on timeupdate');
  player.dispose();
});

QUnit.test('Make sure that player\'s style el respects VIDEOJS_NO_DYNAMIC_STYLE option', function(assert) {
  // clear the HEAD before running this test
  let styles = document.querySelectorAll('style');
  let i = styles.length;

  while (i--) {
    const style = styles[i];

    style.parentNode.removeChild(style);
  }

  let tag = TestHelpers.makeTag();

  tag.id = 'vjs-no-base-theme-tag';
  tag.width = 600;
  tag.height = 300;

  window.VIDEOJS_NO_DYNAMIC_STYLE = true;
  TestHelpers.makePlayer({}, tag);

  styles = document.querySelectorAll('style');
  assert.equal(styles.length, 0, 'we should not get any style elements included in the DOM');

  window.VIDEOJS_NO_DYNAMIC_STYLE = false;
  tag = TestHelpers.makeTag();
  TestHelpers.makePlayer({}, tag);
  styles = document.querySelectorAll('style');
  assert.equal(styles.length, 1, 'we should have one style element in the DOM');
  assert.equal(styles[0].className, 'vjs-styles-dimensions', 'the class name is the one we expected');
});

QUnit.test('When VIDEOJS_NO_DYNAMIC_STYLE is set, apply sizing directly to the tech el', function(assert) {
  // clear the HEAD before running this test
  const styles = document.querySelectorAll('style');
  let i = styles.length;

  while (i--) {
    const style = styles[i];

    style.parentNode.removeChild(style);
  }

  const tag = TestHelpers.makeTag();

  tag.id = 'vjs-no-base-theme-tag';
  tag.width = 600;
  tag.height = 300;

  window.VIDEOJS_NO_DYNAMIC_STYLE = true;
  const player = TestHelpers.makePlayer({}, tag);

  player.width(300);
  player.height(600);
  assert.equal(player.tech_.el().width, 300, 'the width is equal to 300');
  assert.equal(player.tech_.el().height, 600, 'the height is equal 600');

  player.width(600);
  player.height(300);

  assert.equal(player.tech_.el().width, 600, 'the width is equal to 600');
  assert.equal(player.tech_.el().height, 300, 'the height is equal 300');
  player.dispose();
});
