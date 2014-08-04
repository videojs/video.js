var PlayerTest = {
  makeTag: function(){
    var videoTag = document.createElement('video');
    videoTag.id = 'example_1';
    videoTag.className = 'video-js vjs-default-skin';
    return videoTag;
  },
  makePlayer: function(playerOptions, videoTag){
    var player;

    videoTag = videoTag || PlayerTest.makeTag();

    var fixture = document.getElementById('qunit-fixture');
    fixture.appendChild(videoTag);

    playerOptions = playerOptions || {};
    playerOptions['techOrder'] = ['mediaFaker'];

    return player = new videojs.Player(videoTag, playerOptions);
  }
};
