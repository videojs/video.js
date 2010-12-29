#! /bin/csh
# Combines Source Files. In terminal, sh combine_sources.sh
cat src/_begin.js > combined.js

cat src/main.js >> combined.js
cat src/api.js >> combined.js
cat src/html5.js >> combined.js
cat src/flash.js >> combined.js
cat src/behaviors.js >> combined.js
cat src/lib.js >> combined.js
cat src/video-js.jquery.js >> combined.js

cat src/_end.js >> combined.js