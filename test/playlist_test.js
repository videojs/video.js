module("_V_.Playlist#getVideos()");

test('transforms all img elements into PlaylistThumb objects', function() {
  var subject = new _V_.Playlist(mkPlayer(), {});
  equal(subject.videos.length, 2)
});
