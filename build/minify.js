/* eslint-disable no-console, camelcase */

const fs = require('fs');
const uglify = require('uglify-js');
const maxmin = require('maxmin');

const options = {
  nameCache: {},
  output: {
    comments: 'some'
  },
  mangle: true,
  compress: {
    sequences: true,
    dead_code: true,
    conditionals: true,
    booleans: true,
    unused: true,
    if_return: true,
    join_vars: true,
    drop_console: true,
    typeofs: false
  }
};

const minify = (file, dest) => {
  const code = fs.readFileSync(file, 'utf8');
  const minified = uglify.minify(code, options);

  if (minified.error) {
    console.error(minified.error);
    return;
  }

  if (minified.warnings) {
    console.warn(minified.warnings);
  }

  fs.writeFileSync(dest, minified.code, 'utf8');
  console.log('File', dest, 'created:', maxmin(code, minified.code, true));
};

console.log('Minifying files\n');

minify('dist/video.js', 'dist/video.min.js');
minify('dist/alt/video.novtt.js', 'dist/alt/video.novtt.min.js');
minify('dist/alt/video.core.js', 'dist/alt/video.core.min.js');
minify('dist/alt/video.core.novtt.js', 'dist/alt/video.core.novtt.min.js');
