const fs = require('fs');
const zlib = require('zlib');
const Promise = require('bluebird');
const klawSync = require('klaw-sync');
const filesize = require('filesize');
const Table = require('cli-table');

const files = klawSync('dist/', {
  ignore: ['examples', 'lang', 'font', 'ie8', '*.zip', '*.gz'],
  nodir: true
});

Promise.all(files.map(gzipAndStat))
.then(mapFiles)
.then(function(files) {
  logTable(files);

  return files;
})
.then(cleanup)
.catch(function(err) {
  console.error(err.stack);
});

function cleanup(files) {
  files.forEach(function(file) {
    fs.unlinkSync('dist/' + file[0] + '.gz');
  });
}

function mapFiles(files) {
  return files.map(function(file) {
    const path = file[0].path;
    const fileStat = file[0].stats;
    const gzStat = file[1];
    return [file[0].path.split('dist/')[1], filesize(fileStat.size), filesize(gzStat.size)];
  });
}

function gzipAndStat(file) {
  return new Promise(function(resolve, reject) {
    const readStream = fs.createReadStream(file.path);
    const writeStream = fs.createWriteStream(file.path + '.gz');
    const gzip = zlib.createGzip();
    readStream.pipe(gzip).pipe(writeStream).on('close', function() {
      const gzStat = fs.statSync(file.path + '.gz');

      resolve([file, gzStat]);
    })
    .on('error', reject);
  });
}

function logTable(files) {
  const table = new Table({
    head: ['filename', 'size', 'gzipped'],
    colAligns: ['left', 'right', 'right'],
    style: {
      border: ['white']
    }
  });

  table.push.apply(table, files);
  console.log(table.toString());
}
