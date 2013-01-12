module("Component");

test('should create an element', function(){
  var comp = new vjs.Component({}, {});

  ok(comp.el().nodeName);
});

test('should add a child component', function(){
  var comp = new vjs.Component({});

  var child = comp.addChild("component");

  ok(comp.children().length === 1);
  ok(comp.children()[0] === child);
  ok(comp.el().childNodes[0] === child.el());
  ok(comp.getChild('component') === child);
  ok(comp.getChildById(child.id()) === child);
});

test('should init child coponents from options', function(){
  var comp = new vjs.Component({}, {
    children: {
      'component': true
    }
  });

  ok(comp.children().length === 1);
  ok(comp.el().childNodes.length === 1);
});

test('should dispose of component and children', function(){
  var comp = new vjs.Component({});

  // Add a child
  var child = comp.addChild("Component");
  ok(comp.children().length === 1);

  // Add a listener
  comp.on('click', function(){ return true; });
  var data = vjs.getData(comp.el());
  var id = comp.el()[vjs.expando];

  comp.dispose();

  ok(!comp.children(), 'component children were deleted');
  ok(!comp.el(), 'component element was deleted');
  ok(!child.children(), 'child children were deleted');
  ok(!child.el(), 'child element was deleted');
  ok(!vjs.cache[id], 'listener cache nulled')
  ok(vjs.isEmpty(data), 'original listener cache object was emptied')
});

test('should add and remove event listeners to element', function(){
  var comp = new vjs.Component({}, {});

  // No need to make this async because we're triggering events inline.
  // We're going to trigger the event after removing the listener,
  // So if we get extra asserts that's a problem.
  expect(2);

  var testListener = function(){
    ok(true, 'fired event once');
    ok(this === comp, 'listener has the component as context');
  };

  comp.on('test-event', testListener);
  comp.trigger('test-event');
  comp.off('test-event', testListener);
  comp.trigger('test-event');
});

test('should trigger a listener once using one()', function(){
  var comp = new vjs.Component({}, {});

  expect(1);

  var testListener = function(){
    ok(true, 'fired event once');
  };

  comp.one('test-event', testListener);
  comp.trigger('test-event');
  comp.trigger('test-event');
});

test('should trigger a listener when ready', function(){
  expect(2);

  var optionsReadyListener = function(){
    ok(true, 'options listener fired')
  };
  var methodReadyListener = function(){
    ok(true, 'ready method listener fired')
  };

  var comp = new vjs.Component({}, {}, optionsReadyListener);

  comp.triggerReady();

  comp.ready(methodReadyListener);

  // First two listeners should only be fired once and then removed
  comp.triggerReady();
});

test('should add and remove a CSS class', function(){
  var comp = new vjs.Component({}, {});

  comp.addClass('test-class');
  ok(comp.el().className.indexOf('test-class') !== -1);
  comp.removeClass('test-class');
  ok(comp.el().className.indexOf('test-class') === -1);
});

test('should show and hide an element', function(){
  var comp = new vjs.Component({}, {});

  comp.hide();
  ok(comp.el().style.display === 'none');
  comp.show();
  ok(comp.el().style.display === 'block');
});

test('should change the width and height of a component', function(){
  var container = document.createElement('div');
  var comp = new vjs.Component({}, {});
  var el = comp.el();
  var fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(container);
  container.appendChild(el);
  // Container of el needs dimensions or the component won't have dimensions
  container.style.width = '1000px'
  container.style.height = '1000px'

  comp.width('50%');
  comp.height('123px');

  ok(comp.width() === 500, 'percent values working');
  ok(vjs.getComputedStyleValue(el, 'width') === comp.width() + 'px', 'matches computed style');
  ok(comp.height() === 123, 'px values working');

  comp.width(321);
  ok(comp.width() === 321, 'integer values working');
});

module("Core");

test('should create a video tag and have access children in old IE', function(){
  var fixture = document.getElementById('qunit-fixture');

  fixture.innerHTML += "<video id='test_vid_id'><source type='video/mp4'></video>";

  vid = document.getElementById('test_vid_id');

  ok(vid.childNodes.length === 1);
  ok(vid.childNodes[0].getAttribute('type') === 'video/mp4');
});

test('should return a video player instance', function(){
  var fixture = document.getElementById('qunit-fixture');
  fixture.innerHTML += "<video id='test_vid_id'></video><video id='test_vid_id2'></video>";

  var player = videojs('test_vid_id');
  ok(player, 'created player from tag');
  ok(player.id() === 'test_vid_id');
  ok(videojs.players['test_vid_id'] === player, 'added player to global reference')

  var playerAgain = videojs('test_vid_id');
  ok(player === playerAgain, 'did not create a second player from same tag');

  var tag2 = document.getElementById('test_vid_id2');
  var player2 = videojs(tag2);
  ok(player2.id() === 'test_vid_id2', 'created player from element');
});

module("Events");

test('should add and remove an event listener to an element', function(){
  expect(1);

  var el = document.createElement('div');
  var listener = function(){
    ok(true, 'Click Triggered');
  };

  vjs.on(el, 'click', listener);
  vjs.trigger(el, 'click'); // 1 click
  vjs.off(el, 'click', listener)
  vjs.trigger(el, 'click'); // No click should happen.
});

test('should remove all listeners of a type', function(){
  var el = document.createElement('div');
  var clicks = 0;
  var listener = function(){
    clicks++;
  };
  var listener2 = function(){
    clicks++;
  };

  vjs.on(el, 'click', listener);
  vjs.on(el, 'click', listener2);
  vjs.trigger(el, 'click'); // 2 clicks

  ok(clicks === 2, 'both click listeners fired')

  vjs.off(el, 'click')
  vjs.trigger(el, 'click'); // No click should happen.

  ok(clicks === 2, 'no click listeners fired')
});

test('should remove all listeners from an element', function(){
  expect(2);

  var el = document.createElement('div');
  var listener = function(){
    ok(true, 'Fake1 Triggered');
  };
  var listener2 = function(){
    ok(true, 'Fake2 Triggered');
  };

  vjs.on(el, 'fake1', listener);
  vjs.on(el, 'fake2', listener2);

  vjs.trigger(el, 'fake1');
  vjs.trigger(el, 'fake2');

  vjs.off(el);

  // No listener should happen.
  vjs.trigger(el, 'fake1');
  vjs.trigger(el, 'fake2');
});

test('should listen only once', function(){
  expect(1);

  var el = document.createElement('div');
  var listener = function(){
    ok(true, 'Click Triggered');
  };

  vjs.one(el, 'click', listener);
  vjs.trigger(el, 'click'); // 1 click
  vjs.trigger(el, 'click'); // No click should happen.
});

module("Lib");

test('should create an element', function(){
  var div = vjs.createEl();
  var span = vjs.createEl('span', { "data-test": "asdf", innerHTML:'fdsa' })
  ok(div.nodeName === 'DIV');
  ok(span.nodeName === 'SPAN');
  ok(span['data-test'] === 'asdf');
  ok(span.innerHTML === "fdsa");
});

test('should make a string start with an uppercase letter', function(){
  var foo = vjs.capitalize('bar')
  ok(foo === 'Bar');
});

test('should loop through each property on an object', function(){
  var asdf = {
    a: 1,
    b: 2,
    'c': 3
  }

  // Add 3 to each value
  vjs.eachProp(asdf, function(key, value){
    asdf[key] = value + 3;
  });

  deepEqual(asdf,{a:4,b:5,'c':6})
});

test('should add context to a function', function(){
  var newContext = { test: 'obj'};
  var asdf = function(){
    ok(this === newContext);
  }
  var fdsa = vjs.bind(newContext, asdf);

  fdsa();
});

test('should add and remove a class name on an element', function(){
  var el = document.createElement('div');
  vjs.addClass(el, 'test-class')
  ok(el.className === 'test-class', 'class added');
  vjs.addClass(el, 'test-class')
  ok(el.className === 'test-class', 'same class not duplicated');
  vjs.addClass(el, 'test-class2')
  ok(el.className === 'test-class test-class2', 'added second class');
  vjs.removeClass(el, 'test-class')
  ok(el.className === 'test-class2', 'removed first class');
});

test('should get and remove data from an element', function(){
  var el = document.createElement('div');
  var data = vjs.getData(el);
  var id = el[vjs.expando];

  ok(typeof data === 'object', 'data object created');

  // Add data
  var testData = { asdf: 'fdsa' };
  data.test = testData;
  ok(vjs.getData(el).test === testData, 'data added');

  // Remove all data
  vjs.removeData(el);

  ok(!vjs.cache[id], 'cached item nulled')
  ok(el[vjs.expando] === null || el[vjs.expando] === undefined, 'element data id removed')
});

test('should read tag attributes from elements, including HTML5 in all browsers', function(){
  var container = document.createElement('div');

  var tags = '<video id="vid1" controls autoplay loop muted preload="none" src="http://google.com" poster="http://www2.videojs.com/img/video-js-html5-video-player.png" data-test="asdf" data-empty-string=""></video>';
  tags += '<video id="vid2">';
  // Not putting source and track inside video element because
  // oldIE needs the HTML5 shim to read tags inside HTML5 tags.
  // Still may not work in oldIE.
  tags += '<source id="source" src="http://google.com" type="video/mp4" media="fdsa" title="test" >';
  tags += '<track id="track" default src="http://google.com" kind="captions" srclang="en" label="testlabel" title="test" >';
  container.innerHTML += tags;
  document.getElementById('qunit-fixture').appendChild(container);

  var vid1Vals = vjs.getAttributeValues(document.getElementById('vid1'));
  var vid2Vals = vjs.getAttributeValues(document.getElementById('vid2'));
  var sourceVals = vjs.getAttributeValues(document.getElementById('source'));
  var trackVals = vjs.getAttributeValues(document.getElementById('track'));

  deepEqual(vid1Vals, { 'autoplay': true, 'controls': true, 'data-test': "asdf", 'data-empty-string': "", 'id': "vid1", 'loop': true, 'muted': true, 'poster': "http://www2.videojs.com/img/video-js-html5-video-player.png", 'preload': "none", 'src': "http://google.com" });
  deepEqual(vid2Vals, { 'id': "vid2" });
  deepEqual(sourceVals, {'title': "test", 'media': "fdsa", 'type': "video/mp4", 'src': "http://google.com", 'id': "source" });
  deepEqual(trackVals, { "default": true, /* IE no likey default key */ 'id': "track", 'kind': "captions", 'label': "testlabel", 'src': "http://google.com", 'srclang': "en", 'title': "test" });
});

test('should get the right style values for an element', function(){
  var el = document.createElement('div');
  var container = document.createElement('div');
  var fixture = document.getElementById('qunit-fixture')

  container.appendChild(el);
  fixture.appendChild(container);

  container.style.width = "1000px";
  container.style.height = "1000px";

  el.style.height = "100%";
  el.style.width = "123px";

  ok(vjs.getComputedStyleValue(el, 'height') === '1000px');
  ok(vjs.getComputedStyleValue(el, 'width') === '123px');
});

test('should insert an element first in another', function(){
  var el1 = document.createElement('div');
  var el2 = document.createElement('div');
  var parent = document.createElement('div');

  vjs.insertFirst(el1, parent)
  ok(parent.firstChild === el1, 'inserts first into empty parent');

  vjs.insertFirst(el2, parent)
  ok(parent.firstChild === el2, 'inserts first into parent with child');
});

test('should return the element with the ID', function(){
  var el1 = document.createElement('div');
  var el2 = document.createElement('div');
  var fixture = document.getElementById('qunit-fixture');

  fixture.appendChild(el1);
  fixture.appendChild(el2);

  el1.id = 'test_id1';
  el2.id = 'test_id2';

  ok(vjs.el("test_id1") === el1, 'found element for ID');
  ok(vjs.el("#test_id2") === el2, 'found element for CSS ID');
});

test('should trim whitespace from a string', function(){
  ok(vjs.trim(' asdf asdf asdf   \t\n\r') === 'asdf asdf asdf');
});

test('should round a number', function(){
  ok(vjs.round(1.01) === 1);
  ok(vjs.round(1.5) === 2);
  ok(vjs.round(1.55, 2) === 1.55);
  ok(vjs.round(10.551, 2) === 10.55);
});

test('should format time as a string', function(){
  ok(vjs.formatTime(1) === "0:01");
  ok(vjs.formatTime(10) === "0:10");
  ok(vjs.formatTime(60) === "1:00");
  ok(vjs.formatTime(600) === "10:00");
  ok(vjs.formatTime(3600) === "1:00:00");
  ok(vjs.formatTime(36000) === "10:00:00");
  ok(vjs.formatTime(360000) === "100:00:00");

  // Using guide should provide extra leading zeros
  ok(vjs.formatTime(1,1) === "0:01");
  ok(vjs.formatTime(1,10) === "0:01");
  ok(vjs.formatTime(1,60) === "0:01");
  ok(vjs.formatTime(1,600) === "00:01");
  ok(vjs.formatTime(1,3600) === "0:00:01");
  // Don't do extra leading zeros for hours
  ok(vjs.formatTime(1,36000) === "0:00:01");
  ok(vjs.formatTime(1,360000) === "0:00:01");
});

test('should create a fake timerange', function(){
  var tr = vjs.createTimeRange(0, 10);
  ok(tr.start() === 0);
  ok(tr.end() === 10);
});

test('should get an absolute URL', function(){
  // Errors on compiled tests that don't use unit.html. Need a better solution.
  // ok(vjs.getAbsoluteURL('unit.html') === window.location.href);
  ok(vjs.getAbsoluteURL('http://asdf.com') === "http://asdf.com");
  ok(vjs.getAbsoluteURL('https://asdf.com/index.html') === "https://asdf.com/index.html");
});

module("HTML5");

module("Player");

var PlayerTest = {
  makeTag: function(){
    var videoTag = document.createElement('video');
    videoTag.id = 'example_1';
    videoTag.className = 'video-js vjs-default-skin';
    return videoTag;
  },
  makePlayer: function(playerOptions){
    var videoTag = PlayerTest.makeTag();

    var fixture = document.getElementById('qunit-fixture');
    fixture.appendChild(videoTag);

    return player = new vjs.Player(videoTag, playerOptions);
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

  ok(player0.options['attr'] === 1, 'global option was set')
  player0.dispose();

  // Set a tag level option
  var tag1 = PlayerTest.makeTag();
  tag1.setAttribute('attr', 'asdf'); // Attributes must be set as strings

  var player1 = new vjs.Player(tag1);
  ok(player1.options['attr'] === 'asdf', 'Tag options overrode global options');
  player1.dispose();

  // Set a tag level option
  var tag2 = PlayerTest.makeTag();
  tag2.setAttribute('attr', 'asdf');

  var player2 = new vjs.Player(tag2, { 'attr': 'fdsa' });
  ok(player2.options['attr'] === 'fdsa', 'Init options overrode tag and global options');
  player2.dispose();
});

test('should get tag, source, and track settings', function(){
  // Partially tested in lib->getAttributeValues

  var fixture = document.getElementById('qunit-fixture');

  var html = '<video id="example_1" class="video-js" autoplay preload="metadata">'
      html += '<source src="http://google.com" type="video/mp4">';
      html += '<source src="http://google.com" type="video/webm">';
      html += '<track src="http://google.com" kind="captions" default>';
      html += '</video>';

  fixture.innerHTML += html;

  var tag = document.getElementById('example_1');
  var player = new vjs.Player(tag);

  ok(player.options['autoplay'] === true);
  ok(player.options['preload'] === 'metadata'); // No extern. Use string.
  ok(player.options['id'] === 'example_1');
  ok(player.options['sources'].length === 2);
  ok(player.options['sources'][0].src === 'http://google.com');
  ok(player.options['sources'][0].type === 'video/mp4');
  ok(player.options['sources'][1].type === 'video/webm');
  ok(player.options['tracks'].length === 1);
  ok(player.options['tracks'][0]['kind'] === 'captions'); // No extern
  ok(player.options['tracks'][0]['default'] === true);

  ok(player.el().className.indexOf('video-js') !== -1, 'transferred class from tag to player div');
  ok(player.el().id === 'example_1', 'transferred id from tag to player div');

  ok(tag.player === player, 'player referenceable on original tag');
  ok(vjs.players[player.id()] === player, 'player referenceable from global list');
  ok(tag.id !== player.id, 'tag ID no longer is the same as player ID');
  ok(tag.className !== player.el().className, 'tag classname updated');

  player.dispose();

  ok(tag.player === null, 'tag player ref killed')
  ok(!vjs.players['example_1'], 'global player ref killed')
  ok(player.el() === null, 'player el killed')
});

test('should set the width and height of the player', function(){
  var player = PlayerTest.makePlayer({ width: 123, height: '100%' });

  ok(player.width() === 123)
  ok(player.el().style.width === '123px')

  var fixture = document.getElementById('qunit-fixture');
  var container = document.createElement('div');
  fixture.appendChild(container);

  // Player container needs to have height in order to have height
  // Don't want to mess with the fixture itself
  container.appendChild(player.el());
  container.style.height = "1000px";
  ok(player.height() === 1000);

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

  ok(el.parentNode === container, 'player placed at same level as tag')
  // Tag may be placed inside the player element or it may be removed from the DOM
  ok(tag.parentNode !== container, 'tag removed from original place')

  player.dispose();
});

test('should load a media controller', function(){
  var player = PlayerTest.makePlayer({
    preload: 'none',
    sources: [
      { src: "http://google.com", type: 'video/mp4' },
      { src: "http://google.com", type: 'video/webm' }
    ]
  });

  ok(player.el().children[0].className.indexOf('vjs-tech') !== -1, 'media controller loaded')

  player.dispose();
});

module("Setup");

// Logging setup for phantom integration
// adapted from Modernizr & Bootstrap

QUnit.begin = function () {
  console.log("Starting test suite")
  console.log("================================================\n")
}

QUnit.moduleDone = function (opts) {
  if (opts.failed === 0) {
    console.log("\u2714 All tests passed in '" + opts.name + "' module")
  } else {
    console.log("\u2716 " + opts.failed + " tests failed in '" + opts.name + "' module")
  }
}

QUnit.done = function (opts) {
  console.log("\n================================================")
  console.log("Tests completed in " + opts.runtime + " milliseconds")
  console.log(opts.passed + " tests of " + opts.total + " passed, " + opts.failed + " failed.")
}