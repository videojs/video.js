module("Player", {
  setup: function(){
    var videoTag = document.createElement('video');
    videoTag.id = 'example_1';
    videoTag.className = 'video-js vjs-default-skin';

    var fixture = document.getElementById('qunit-fixture');
    fixture.appendChild(videoTag);

    this.player = new _V_.Player(videoTag, {});
  },
  teardown: function(){

  }
});

test('should create and embed a new player element', function(){
  ok(this.player.el.nodeName === 'DIV');
  ok(this.player.el.parentNode.id === 'qunit-fixture');
  ok(this.player.el.className.indexOf('video-js vjs-default-skin') !== -1);
  ok(this.player.el.id === 'example_1');
});