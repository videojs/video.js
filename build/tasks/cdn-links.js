module.exports = function(grunt) {
  grunt.registerTask('cdn-links', 'Update the version of CDN links in docs', function(){
    let doc = grunt.file.read('docs/guides/setup.md');
    let version = require('../../package.json').version;

    // remove the patch version to point to the latest patch
    version = version.replace(/(\d+\.\d+)\.\d+/, '$1');

    // update the version in http://vjs.zencdn.net/4.3/video.js
    doc = doc.replace(/(\/\/vjs\.zencdn\.net\/)\d+\.\d+(\.\d+)?/g, '$1'+version);
    grunt.file.write('docs/guides/setup.md', doc);
  });
};
