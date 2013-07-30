module('HTML5');

test('should detect whether the volume can be changed', function(){
  var testVid, ConstVolumeVideo;
  if (!{}['__defineSetter__']) {
    ok(true, 'your browser does not support this test, skipping it');
    return;
  }
  testVid = vjs.TEST_VID;
  ConstVolumeVideo = function(){
    this.volume = 1;
    this.__defineSetter__('volume', function(){});
  };
  vjs.TEST_VID = new ConstVolumeVideo();

  ok(!vjs.Html5.canControlVolume());
  vjs.TEST_VID = testVid;
});

test('should re-link the player if the tech is moved', function(){
  var player, tech, el;
  el = document.createElement('div');
  el.innerHTML = '<div />';
  player = {
    id: function(){ return 'id'; },
    el: function(){ return el; },
    options_: {},
    ready: function(){}
  };
  tech = new vjs.Html5(player, {});
  vjs.Html5.movingMediaElementInDOM = false;
  tech.createEl();

  strictEqual(player, tech.el()['player']);
});

test('should not call default action on media event', function() {
  expect(2);
  var player = {
    id: function() { return 'id'; },
    el: function() { return document.createElement('div'); },
    options_: {},
    trigger: function(event) {
      ok(event.type === 'play', 'non-play media event fired');
      ok(event.isDefaultPrevented(), 'default action not prevented');
    },
    ready: function() {}
  };
  var tech = new vjs.Html5(player, { el: vjs.TEST_VID });
  // Mediafaker doesn't support play/pause, so dispatch an event manually.
  var event = document.createEvent('CustomEvent');
  event.initCustomEvent('play', false /*bubbles*/, true /*cancelable*/, null);
  tech.el_.dispatchEvent(event);
});