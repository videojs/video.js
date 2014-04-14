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
    options: function(){ return {}; },
    controls: function(){ return false; },
    usingNativeControls: function(){ return false; },
    on: function(){ return this; },
    ready: function(){}
  };
  tech = new vjs.Html5(player, {});
  vjs.Html5.movingMediaElementInDOM = false;
  tech.createEl();

  strictEqual(player, tech.el()['player']);
});

test('test playbackRate', function() {
  var el, player, playbackRate, tech;

  el = document.createElement('div');
  el.innerHTML = '<div />';

  player = {
    id: function(){ return 'id'; },
    el: function(){ return el; },
    options_: {},
    options: function(){ return {}; },
    controls: function(){ return false; },
    usingNativeControls: function(){ return false; },
    on: function(){ return this; },
    ready: function(){}
  };

  tech = new vjs.Html5(player, {});
  tech.createEl();

  tech.el_.playbackRate = 1.25;
  strictEqual(tech.playbackRate(), 1.25);

  tech['setPlaybackRate'](0.75);
  strictEqual(tech.playbackRate(), 0.75);
});
