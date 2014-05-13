module('Player');

// Compiler doesn't like using 'this' in setup/teardown.
// module("Player", {
//   /**
//    * @this {*}
//    */
//   setup: function(){
//     window.player1 = true; // using window works
//   },

//   /**
//    * @this {*}
//    */
//   teardown: function(){
//     // if (this.player && this.player.el() !== null) {
//     //   this.player.dispose();
//     //   this.player = null;
//     // }
//   }
// });

// Object.size = function(obj) {
//     var size = 0, key;
//     for (key in obj) {
//         console.log('key', key)
//         if (obj.hasOwnProperty(key)) size++;
//     }
//     return size;
// };


test('should create player instance that inherits from component and dispose it', function(){
  var player = PlayerTest.makePlayer();

  ok(player.el().nodeName === 'DIV');
  ok(player.on, 'component function exists');

  player.dispose();
  ok(player.el() === null, 'element disposed');
});

test('should accept options from multiple sources and override in correct order', function(){
  // For closure compiler to work, all reference to the prop have to be the same type
  // As in options['attr'] or options.attr. Compiler will minimize each separately.
  // Since we're using setAttribute which requires a string, we have to use the string
  // version of the key for all version.

  // Set a global option
  vjs.options['attr'] = 1;

  var tag0 = PlayerTest.makeTag();
  var player0 = new vjs.Player(tag0);

  ok(player0.options_['attr'] === 1, 'global option was set');
  player0.dispose();

  // Set a tag level option
  var tag1 = PlayerTest.makeTag();
  tag1.setAttribute('attr', 'asdf'); // Attributes must be set as strings

  var player1 = new vjs.Player(tag1);
  ok(player1.options_['attr'] === 'asdf', 'Tag options overrode global options');
  player1.dispose();

  // Set a tag level option
  var tag2 = PlayerTest.makeTag();
  tag2.setAttribute('attr', 'asdf');

  var player2 = new vjs.Player(tag2, { 'attr': 'fdsa' });
  ok(player2.options_['attr'] === 'fdsa', 'Init options overrode tag and global options');
  player2.dispose();
});

test('should get tag, source, and track settings', function(){
  // Partially tested in lib->getAttributeValues

  var fixture = document.getElementById('qunit-fixture');

  var html = '<video id="example_1" class="video-js" autoplay preload="none">';
      html += '<source src="http://google.com" type="video/mp4">';
      html += '<source src="http://google.com" type="video/webm">';
      html += '<track src="http://google.com" kind="captions" attrtest>';
      html += '</video>';

  fixture.innerHTML += html;

  var tag = document.getElementById('example_1');
  var player = PlayerTest.makePlayer({}, tag);

  ok(player.options_['autoplay'] === true);
  ok(player.options_['preload'] === 'none'); // No extern. Use string.
  ok(player.options_['id'] === 'example_1');
  ok(player.options_['sources'].length === 2);
  ok(player.options_['sources'][0].src === 'http://google.com');
  ok(player.options_['sources'][0].type === 'video/mp4');
  ok(player.options_['sources'][1].type === 'video/webm');
  ok(player.options_['tracks'].length === 1);
  ok(player.options_['tracks'][0]['kind'] === 'captions'); // No extern
  ok(player.options_['tracks'][0]['attrtest'] === '');

  ok(player.el().className.indexOf('video-js') !== -1, 'transferred class from tag to player div');
  ok(player.el().id === 'example_1', 'transferred id from tag to player div');

  ok(vjs.players[player.id()] === player, 'player referenceable from global list');
  ok(tag.id !== player.id, 'tag ID no longer is the same as player ID');
  ok(tag.className !== player.el().className, 'tag classname updated');

  player.dispose();

  ok(tag['player'] !== player, 'tag player ref killed');
  ok(!vjs.players['example_1'], 'global player ref killed');
  ok(player.el() === null, 'player el killed');
});

test('should set the width and height of the player', function(){
  var player = PlayerTest.makePlayer({ width: 123, height: '100%' });

  ok(player.width() === 123);
  ok(player.el().style.width === '123px');

  var fixture = document.getElementById('qunit-fixture');
  var container = document.createElement('div');
  fixture.appendChild(container);

  // Player container needs to have height in order to have height
  // Don't want to mess with the fixture itself
  container.appendChild(player.el());
  container.style.height = '1000px';
  ok(player.height() === 1000);

  player.dispose();
});

test('should not force width and height', function() {
  var player = PlayerTest.makePlayer({ width: 'auto', height: 'auto' });
  ok(player.el().style.width === '', 'Width is not forced');
  ok(player.el().style.height === '', 'Height is not forced');

  player.dispose();
});

test('should wrap the original tag in the player div', function(){
  var tag = PlayerTest.makeTag();
  var container = document.createElement('div');
  var fixture = document.getElementById('qunit-fixture');

  container.appendChild(tag);
  fixture.appendChild(container);

  var player = new vjs.Player(tag);
  var el = player.el();

  ok(el.parentNode === container, 'player placed at same level as tag');
  // Tag may be placed inside the player element or it may be removed from the DOM
  ok(tag.parentNode !== container, 'tag removed from original place');

  player.dispose();
});

test('should set and update the poster value', function(){
  var tag, poster, updatedPoster, player;

  poster = 'http://example.com/poster.jpg';
  updatedPoster = 'http://example.com/updated-poster.jpg';

  tag = PlayerTest.makeTag();
  tag.setAttribute('poster', poster);

  player = PlayerTest.makePlayer({}, tag);
  equal(player.poster(), poster, 'the poster property should equal the tag attribute');

  var pcEmitted = false;
  player.on('posterchange', function(){
    pcEmitted = true;
  });

  player.poster(updatedPoster);
  ok(pcEmitted, 'posterchange event was emitted');
  equal(player.poster(), updatedPoster, 'the updated poster is returned');

  player.dispose();
});

test('should load a media controller', function(){
  var player = PlayerTest.makePlayer({
    preload: 'none',
    sources: [
      { src: 'http://google.com', type: 'video/mp4' },
      { src: 'http://google.com', type: 'video/webm' }
    ]
  });

  ok(player.el().children[0].className.indexOf('vjs-tech') !== -1, 'media controller loaded');

  player.dispose();
});

test('should be able to initialize player twice on the same tag using string reference', function() {
  var videoTag = PlayerTest.makeTag();
  var id = videoTag.id;

  var fixture = document.getElementById('qunit-fixture');
  fixture.appendChild(videoTag);

  var player = vjs(videoTag.id);
  ok(player, 'player is created');
  player.dispose();

  ok(!document.getElementById(id), 'element is removed');
  videoTag = PlayerTest.makeTag();
  fixture.appendChild(videoTag);

  //here we receive cached version instead of real
  player = vjs(videoTag.id);
  //here it triggers error, because player was destroyed already after first dispose
  player.dispose();
});

test('should set controls and trigger events', function() {
  expect(6);

  var player = PlayerTest.makePlayer({ 'controls': false });
  ok(player.controls() === false, 'controls set through options');
  var hasDisabledClass = player.el().className.indexOf('vjs-controls-disabled');
  ok(hasDisabledClass !== -1, 'Disabled class added to player');

  player.controls(true);
  ok(player.controls() === true, 'controls updated');
  var hasEnabledClass = player.el().className.indexOf('vjs-controls-enabled');
  ok(hasEnabledClass !== -1, 'Disabled class added to player');

  player.on('controlsenabled', function(){
    ok(true, 'enabled fired once');
  });
  player.on('controlsdisabled', function(){
    ok(true, 'disabled fired once');
  });
  player.controls(false);
  player.controls(true);
  // Check for unnecessary events
  player.controls(true);

  player.dispose();
});

// Can't figure out how to test fullscreen events with tests
// Browsers aren't triggering the events at least
// asyncTest('should trigger the fullscreenchange event', function() {
//   expect(3);

//   var player = PlayerTest.makePlayer();
//   player.on('fullscreenchange', function(){
//     ok(true, 'fullscreenchange event fired');
//     ok(this.isFullScreen() === true, 'isFullScreen is true');
//     ok(this.el().className.indexOf('vjs-fullscreen') !== -1, 'vjs-fullscreen class added');

//     player.dispose();
//     start();
//   });

//   player.requestFullScreen();
// });

test('should toggle user the user state between active and inactive', function(){
  var player = PlayerTest.makePlayer({});

  expect(9);

  ok(player.userActive(), 'User should be active at player init');

  player.on('userinactive', function(){
    ok(true, 'userinactive event triggered');
  });

  player.on('useractive', function(){
    ok(true, 'useractive event triggered');
  });

  player.userActive(false);
  ok(player.userActive() === false, 'Player state changed to inactive');
  ok(player.el().className.indexOf('vjs-user-active') === -1, 'Active class removed');
  ok(player.el().className.indexOf('vjs-user-inactive') !== -1, 'Inactive class added');

  player.userActive(true);
  ok(player.userActive() === true, 'Player state changed to active');
  ok(player.el().className.indexOf('vjs-user-inactive') === -1, 'Inactive class removed');
  ok(player.el().className.indexOf('vjs-user-active') !== -1, 'Active class added');

  player.dispose();
});

test('should add a touch-enabled classname when touch is supported', function(){
  var player;

  expect(1);

  // Fake touch support. Real touch support isn't needed for this test.
  var origTouch = vjs.TOUCH_ENABLED;
  vjs.TOUCH_ENABLED = true;

  player = PlayerTest.makePlayer({});

  ok(player.el().className.indexOf('vjs-touch-enabled'), 'touch-enabled classname added');


  vjs.TOUCH_ENABLED = origTouch;
  player.dispose();
});

test('should allow for tracking when native controls are used', function(){
  var player = PlayerTest.makePlayer({});

  expect(6);

  // Make sure native controls is false before starting test
  player.usingNativeControls(false);

  player.on('usingnativecontrols', function(){
    ok(true, 'usingnativecontrols event triggered');
  });

  player.on('usingcustomcontrols', function(){
    ok(true, 'usingcustomcontrols event triggered');
  });

  player.usingNativeControls(true);
  ok(player.usingNativeControls() === true, 'Using native controls is true');
  ok(player.el().className.indexOf('vjs-using-native-controls') !== -1, 'Native controls class added');

  player.usingNativeControls(false);
  ok(player.usingNativeControls() === false, 'Using native controls is false');
  ok(player.el().className.indexOf('vjs-using-native-controls') === -1, 'Native controls class removed');

  player.dispose();
});

// test('should use custom message when encountering an unsupported video type',
//     function() {
//   videojs.options['notSupportedMessage'] = 'Video no go <a href="">link</a>';
//   var fixture = document.getElementById('qunit-fixture');

//   var html =
//       '<video id="example_1">' +
//           '<source src="fake.foo" type="video/foo">' +
//           '</video>';

//   fixture.innerHTML += html;

//   var tag = document.getElementById('example_1');
//   var player = new vjs.Player(tag);

//   var incompatibilityMessage = player.el().getElementsByTagName('p')[0];
//   // ie8 capitalizes tag names
//   equal(incompatibilityMessage.innerHTML.toLowerCase(), 'video no go <a href="">link</a>');

//   player.dispose();
// });

test('should register players with generated ids', function(){
  var fixture, video, player, id;
  fixture = document.getElementById('qunit-fixture');

  video = document.createElement('video');
  video.className = 'vjs-default-skin video-js';
  fixture.appendChild(video);

  player = new vjs.Player(video);
  id = player.el().id;

  equal(player.el().id, player.id(), 'the player and element ids are equal');
  ok(vjs.players[id], 'the generated id is registered');
});

test('should not add multiple first play events despite subsequent loads', function() {
  expect(1);

  var player = PlayerTest.makePlayer({});

  player.on('firstplay', function(){
    ok('First play should fire once.');
  });

  // Checking to make sure onLoadStart removes first play listener before adding a new one.
  player.trigger('loadstart');
  player.trigger('loadstart');
  player.trigger('play');
});

test('should remove vjs-has-started class', function(){
  expect(3);

  var player = PlayerTest.makePlayer({});

  player.trigger('loadstart');
  player.trigger('play');
  ok(player.el().className.indexOf('vjs-has-started') !== -1, 'vjs-has-started class added');

  player.trigger('loadstart');
  ok(player.el().className.indexOf('vjs-has-started') === -1, 'vjs-has-started class removed');

  player.trigger('play');
  ok(player.el().className.indexOf('vjs-has-started') !== -1, 'vjs-has-started class added again');
});

test('player should handle different error types', function(){
  expect(8);
  var player = PlayerTest.makePlayer({});
  var testMsg = 'test message';

  // prevent error log messages in the console
  sinon.stub(vjs.log, 'error');

  // error code supplied
  function errCode(){
    equal(player.error().code, 1, 'error code is correct');
  }
  player.on('error', errCode);
  player.error(1);
  player.off('error', errCode);

  // error instance supplied
  function errInst(){
    equal(player.error().code, 2, 'MediaError code is correct');
    equal(player.error().message, testMsg, 'MediaError message is correct');
  }
  player.on('error', errInst);
  player.error(new vjs.MediaError({ code: 2, message: testMsg }));
  player.off('error', errInst);

  // error message supplied
  function errMsg(){
    equal(player.error().code, 0, 'error message code is correct');
    equal(player.error().message, testMsg, 'error message is correct');
  }
  player.on('error', errMsg);
  player.error(testMsg);
  player.off('error', errMsg);

  // error config supplied
  function errConfig(){
    equal(player.error().code, 3, 'error config code is correct');
    equal(player.error().message, testMsg, 'error config message is correct');
  }
  player.on('error', errConfig);
  player.error({ code: 3, message: testMsg });
  player.off('error', errConfig);

  // check for vjs-error classname
  ok(player.el().className.indexOf('vjs-error') >= 0, 'player does not have vjs-error classname');

  // restore error logging
  vjs.log.error.restore();
});

