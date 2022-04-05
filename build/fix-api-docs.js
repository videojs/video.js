const replace = require('replace');
const path = require('path');
const apiPath = path.join(__dirname, '..', 'docs', 'api');

const replacements = [
  {find: /\/docs\/guides\/(.+)\.md/g, replace: 'tutorial-$1.html'},
  {find: /tutorial-tech.html/g, replace: 'tutorial-tech_.html'},
  {find: /\/docs\/guides\//g, replace: '#'},
  {find: /(\<h[1-6] id="(?:.*)?)video-js(.*)?"\>/g, replace: '$1videojs$2">'},
  {find: /(\<h[1-6] id="(?:.*)?)don-t(.*)?"\>/g, replace: '$1dont$2">'},
  {find: /(\<h[1-6] id="(?:.*)?)node-js(.*)?"\>/g, replace: '$1nodejs$2">'},
  {find: /(\<h[1-6] id="(?:.*)?)vtt-js(.*)?"\>/g, replace: '$1vttjs$2">'},
  {find: /(\<h[1-6] id=")-(.*)("\>)/g, replace: '$1$2$3'},
  {find: /(\<h[1-6] id=")(.*)-("\>)/g, replace: '$1$2$3'},
  {find: /(\<h[1-6] id=".*)-docs-guides-.*-md("\>)/g, replace: '$1$2'},
  // replace all children with children-1
  {find: /\<h3 id="children"\>/g, replace: '<h3 id="children-1">'},
  // remove the -1 from the first item
  {find: /\<h3 id="children-1"\>/, replace: '<h3 id="children">'},
  {find: '<h4 id="nativecontrolsfortouch">', replace: '<h4 id="nativecontrolsfortouch-1">'},
  {find: '<h3 id="videojs-(audio|video)track">', replace: '<h3 id="videojs$1track">'},
  {find: '<h3 id="text-tracks">', replace: '<h3 id="text-tracks-1">'},
  {find: '<h2 id="q-how-can-i-hide-the-links-to-my-video-subtitles-audio-tracks">',
    replace: '<h2 id="q-how-can-i-hide-the-links-to-my-videosubtitlesaudiotracks">'},
  {find: '<h3 id="dispose-http-docs-videojs-com-player-html-dispose">',
    replace: '<h3 id="dispose">'},
  {find: '<h4 id="effect-on-player-width-and-player-height">',
    replace: '<h4 id="effect-on-playerwidth-and-playerheight">'},
  {find: '<h4 id="i-want-to-have-a-single-source-and-dont-care-about-live-adaptive-streaming">',
    replace: '<h4 id="i-want-to-have-a-single-source-and-dont-care-about-liveadaptive-streaming">'},
  {find: '<h2 id="api-docs-api">', replace: '<h2 id="api-docs">'},
  {find: '<h2 id="guides-docs-guides">', replace: '<h2 id="guides">'}
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
