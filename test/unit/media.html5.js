module('HTML5');

test('should detect whether the volume can be changed', function(){
  var
    testVid = vjs.TEST_VID,
    ConstVolumeVideo = function(){
      this.volume = 1;
      this.__defineSetter__('volume', function(){});
    };
  vjs.TEST_VID = new ConstVolumeVideo();

  ok(!vjs.Html5.canControlVolume());
  vjs.TEST_VID = testVid;
});
