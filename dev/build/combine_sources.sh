#! /bin/csh
# Combines Source Files. In terminal, sh combine_sources.sh
# It will put a new video.js file under dist/

cat ../src/_begin.js > ../dist/video.js

cat ../src/core.js >> ../dist/video.js
cat ../src/api.js >> ../dist/video.js

cat ../src/lib.js >> ../dist/video.js
cat ../src/log.js >> ../dist/video.js

cat ../src/ecma.js >> ../dist/video.js
cat ../src/json.js >> ../dist/video.js
cat ../src/events.js >> ../dist/video.js
cat ../src/tracks.js >> ../dist/video.js

cat ../src/tech/html5.js >> ../dist/video.js
cat ../src/tech/flowplayer.js >> ../dist/video.js

# h5swf temporarily requires swfobject
cat ../src/tech/h5swf.js >> ../dist/video.js
cat ../flash/swfobject.js >> ../dist/video.js
# So does Youtube
cat ../src/tech/youtube.js >> ../dist/video.js

cat ../src/behaviors/behaviors.js >> ../dist/video.js
cat ../src/behaviors/seekBar.js >> ../dist/video.js
cat ../src/behaviors/texttrackdisplays.js >> ../dist/video.js
cat ../src/behaviors/volume.js >> ../dist/video.js

cat ../src/controls/bar.js >> ../dist/video.js
cat ../src/controls/bigPlay.js >> ../dist/video.js
cat ../src/controls/subtitlesBox.js >> ../dist/video.js

cat ../src/autoload.js >> ../dist/video.js

cat ../src/_end.js >> ../dist/video.js