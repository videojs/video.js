/* eslint-disable no-console */
const fs = require('fs');
const zlib = require('zlib');
const filesize = require('filesize');
const Table = require('cli-table');
const path = require('path');
const sh = require('shelljs');

// find all js/css files in the dist dir
// but ignore any files in lang, example, or font directories
const filepaths = sh.find(path.join(__dirname, '..', 'dist', '**', '*.{js,css}')).filter(function(filepath) {
  if ((/\/(lang|example|font)\//).test(filepath)) {
    return false;
  }

  return true;
});

// map all files that we found into an array of
// table entries the filepath, file size, and gzip size.
Promise.all(filepaths.map(function(filepath) {
  return new Promise(function(resolve, reject) {
    const readStream = fs.createReadStream(filepath);
    const writeStream = fs.createWriteStream(filepath + '.gz');
    const gzip = zlib.createGzip();

    readStream.pipe(gzip).pipe(writeStream).on('close', function() {
      const gzStat = fs.statSync(filepath + '.gz');
      const fileStat = fs.statSync(filepath);

      fs.unlinkSync(filepath + '.gz');

      resolve([filepath.split('dist/')[1], filesize(fileStat.size), filesize(gzStat.size)]);
    })
      .on('error', reject);
  });
})).then(function(lines) {
  // log all the files and there sizes using a cli table
  const table = new Table({
    head: ['filename', 'size', 'gzipped'],
    colAligns: ['left', 'right', 'right'],
    style: {
      border: ['white']
    }
  });

  table.push.apply(table, lines);
  console.log(table.toString());

}).catch(function(err) {
  console.error(err.stack);
});
