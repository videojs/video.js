#! /bin/csh
# Combines Source Files. In terminal, sh combine_sources.sh
# It will put a new video.js file under dist/

# FILES=../src/*
# for f in $FILES
# do
#   echo "Processing $f file..."
#   # take action on each file. $f store current file name
#   cat $f
# done

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

cat ../src/components.js >> ../dist/video.js

cat ../src/autoload.js >> ../dist/video.js

cat ../src/_end.js >> ../dist/video.js
