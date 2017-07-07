var replace = require("replace");
var path = require('path')
var apiPath = path.join(__dirname, '..', 'docs', 'api');

var replacements = [
  {find: /\/docs\/guides\/(.+)\.md/g, replace: 'tutorial-$1.html'},
  {find: /tutorial-tech.html/g, replace: 'tutorial-tech_.html'},
  {find: /\/docs\/guides\//g, replace: '#'},
  {find: /(\<h[1-6] id="(?:.*)?)video-js(.*)?"\>/g, replace: '$1videojs$2">'},
  {find: /(\<h[1-6] id="(?:.*)?)don-t(.*)?"\>/g, replace: '$1dont$2">'},
  {find: /(\<h[1-6] id="(?:.*)?)node-js(.*)?"\>/g, replace: '$1nodejs$2">'},
  {find: /(\<h[1-6] id="(?:.*)?)vtt-js(.*)?"\>/g, replace: '$1vttjs$2">'},
  {find: /(\<h[1-6] id=")-(.*)("\>)/g, replace: '$1$2$3'},
  {find: /(\<h[1-6] id=")(.*)-("\>)/g, replace: '$1$2$3'},
  {find: '<h3 id="videojs-audiotrack">', replace: '<h3 id="videojsaudiotrack">'},
  {find: '<h3 id="text-tracks">', replace: '<h3 id="text-tracks-1">'},
  {find: '<h2 id="q-how-can-i-hide-the-links-to-my-video-subtitles-audio-tracks">',
   replace: '<h2 id="q-how-can-i-hide-the-links-to-my-videosubtitlesaudiotracks">'}
];


replacements.forEach(function(obj) {
  replace({
    regex: obj.find,
    replacement: obj.replace,
    paths: [apiPath],
    recursive: true,
    silent: true
  });
});
