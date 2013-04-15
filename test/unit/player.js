module('Player');

var PlayerTest = {
  makeTag: function(){
    var videoTag = document.createElement('video');
    videoTag.id = 'example_1';
    videoTag.className = 'video-js vjs-default-skin';
    return videoTag;
  },
  makePlayer: function(playerOptions){
    var player;
    var videoTag = PlayerTest.makeTag();

    var fixture = document.getElementById('qunit-fixture');
    fixture.appendChild(videoTag);

    var opts = vjs.obj.merge({
      'techOrder': ['mediaFaker']
    }, playerOptions);

    return player = new vjs.Player(videoTag, opts);
  }
};

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

  var html = '<video id="example_1" class="video-js" autoplay preload="metadata">';
      html += '<source src="http://google.com" type="video/mp4">';
      html += '<source src="http://google.com" type="video/webm">';
      html += '<track src="http://google.com" kind="captions" default>';
      html += '</video>';

  fixture.innerHTML += html;

  var tag = document.getElementById('example_1');
  var player = new vjs.Player(tag);

  ok(player.options_['autoplay'] === true);
  ok(player.options_['preload'] === 'metadata'); // No extern. Use string.
  ok(player.options_['id'] === 'example_1');
  ok(player.options_['sources'].length === 2);
  ok(player.options_['sources'][0].src === 'http://google.com');
  ok(player.options_['sources'][0].type === 'video/mp4');
  ok(player.options_['sources'][1].type === 'video/webm');
  ok(player.options_['tracks'].length === 1);
  ok(player.options_['tracks'][0]['kind'] === 'captions'); // No extern
  ok(player.options_['tracks'][0]['default'] === true);

  ok(player.el().className.indexOf('video-js') !== -1, 'transferred class from tag to player div');
  ok(player.el().id === 'example_1', 'transferred id from tag to player div');

  ok(vjs.players[player.id()] === player, 'player referenceable from global list');
  ok(tag.id !== player.id, 'tag ID no longer is the same as player ID');
  ok(tag.className !== player.el().className, 'tag classname updated');

  player.dispose();

  ok(tag['player'] === null, 'tag player ref killed');
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

test('should accept options from multiple sources and override in correct order', function(){
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

test('should transfer the poster attribute unmodified', function(){
  var tag, fixture, poster, player;
  poster = 'http://example.com/poster.jpg';
  tag = PlayerTest.makeTag();
  tag.setAttribute('poster', poster);
  fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(tag);
  player = new vjs.Player(tag, {
    'techOrder': ['mediaFaker']
  });

  equal(player.tech.el().poster, poster, 'the poster attribute should not be removed');

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
