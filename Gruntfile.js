module.exports = function(grunt) {
  var pkg, s3, semver, version, verParts, uglify, exec;

  semver = require('semver');
  pkg = grunt.file.readJSON('package.json');
  uglify = require('uglify-js');
  exec = require('child_process').exec;

  try {
    s3 = grunt.file.readJSON('.s3config.json');
  } catch(e) {
    s3 = {};
  }

  verParts = pkg.version.split('.');
  version = {
    full: pkg.version,
    major: verParts[0],
    minor: verParts[1],
    patch: verParts[2]
  };
  version.majorMinor = version.major + '.' + version.minor;

  // loading predefined source order from source-loader.js
  // trust me, this is the easist way to do it so far
  /*jshint undef:false, evil:true */
  var blockSourceLoading = true;
  var sourceFiles; // Needed to satisfy jshint
  eval(grunt.file.read('./build/source-loader.js'));

  // Project configuration.
  grunt.initConfig({
    pkg: pkg,
    build: {
      src: 'src/js/dependencies.js',
      options: {
        baseDir: 'src/js/'
      }
    },
    clean: {
      build: ['build/files/*'],
      dist: ['dist/*']
    },
    jshint: {
      src: {
        src: ['src/js/**/*.js', 'Gruntfile.js', 'test/unit/**/*.js'],
        options: {
          jshintrc: '.jshintrc'
        }
      }
    },
    minify: {
      source:{
        src: ['build/files/combined.video.js', 'build/compiler/goog.base.js', 'src/js/exports.js'],
        externs: ['src/js/player.externs.js', 'src/js/media/flash.externs.js'],
        dest: 'build/files/minified.video.js'
      },
      tests: {
        src: ['build/files/combined.video.js', 'build/compiler/goog.base.js', 'src/js/exports.js', 'test/unit/*.js'],
        externs: ['src/js/player.externs.js', 'src/js/media/flash.externs.js', 'test/qunit-externs.js', 'test/sinon-externs.js'],
        dest: 'build/files/test.minified.video.js'
      }
    },
    dist: {},
    qunit: {
      source: ['test/index.html'],
      minified: ['test/minified.html'],
      minified_api: ['test/minified-api.html']
    },
    watch: {
      files: [ 'src/**/*', 'test/unit/*.js', 'Gruntfile.js' ],
      tasks: 'dev'
    },
    connect: {
      dev: {
        options: {
          port: 9999,
          keepalive: true
        }
      }
    },
    copy: {
      minor: {
        files: [
          {expand: true, cwd: 'build/files/', src: ['*'], dest: 'dist/'+version.majorMinor+'/', filter: 'isFile'} // includes files in path
        ]
      },
      patch: {
        files: [
          {expand: true, cwd: 'build/files/', src: ['*'], dest: 'dist/'+version.full+'/', filter: 'isFile'} // includes files in path
        ]
      }
    },
    s3: {
      options: s3,
      minor: {
        upload: [
          {
            src: 'dist/cdn/*',
            dest: 'vjs/'+version.majorMinor+'/',
            rel: 'dist/cdn/',
            headers: {
              'Cache-Control': 'public, max-age=2628000'
            }
          }
        ]
      },
      patch: {
        upload: [
          {
            src: 'dist/cdn/*',
            dest: 'vjs/'+version.full+'/',
            rel: 'dist/cdn/',
            headers: {
              'Cache-Control': 'public, max-age=31536000'
            }
          }
        ]
      }
    },
    cssmin: {
      minify: {
        expand: true,
        cwd: 'build/files/',
        src: ['video-js.css'],
        dest: 'build/files/',
        ext: '.min.css'
      }
    },
    less: {
      dev: {
        files: {
          'build/files/video-js.css': 'src/css/video-js.less'
        }
      }
    },
    karma: {
      // this config file applies to all following configs except if overwritten
      options: {
        configFile: 'test/karma.conf.js'
      },

      // this only runs on PRs from the mainrepo on saucelabs
      saucelabs: {
        browsers: ['chrome_sl']
      },
      chrome_sl: {
        browsers: ['chrome_sl']
      },
      firefox_sl: {
        browsers: ['firefox_sl']
      },
      safari_sl: {
        browsers: ['safari_sl']
      },
      ipad_sl: {
        browsers: ['ipad_sl']
      },
      android_sl: {
        browsers: ['android_sl']
      },
      ie_sl: {
        browsers: ['ie_sl']
      },

      // these are run locally on local browsers
      dev: {
        browsers: ['Chrome', 'Firefox', 'Safari']
      },
      chromecanary: {
        browsers: ['ChromeCanary']
      },
      chrome: {
        browsers: ['Chrome']
      },
      firefox: {
        browsers: ['Firefox']
      },
      safari: {
        browsers: ['Safari']
      },
      ie: {
        browsers: ['IE']
      },
      phantomjs: {
        browsers: ['PhantomJS']
      },

      // This is all the minified tests run locally on local browsers
      minified_dev: {
        browsers: ['Chrome', 'Firefox', 'Safari'],
        configFile: 'test/karma.minified.conf.js'
      },
      minified_chromecanary: {
        browsers: ['ChromeCanary'],
        configFile: 'test/karma.minified.conf.js'
      },
      minified_chrome: {
        browsers: ['Chrome'],
        configFile: 'test/karma.minified.conf.js'
      },
      minified_firefox: {
        browsers: ['Firefox'],
        configFile: 'test/karma.minified.conf.js'
      },
      minified_safari: {
        browsers: ['Safari'],
        configFile: 'test/karma.minified.conf.js'
      },
      minified_ie: {
        browsers: ['IE'],
        configFile: 'test/karma.minified.conf.js'
      },
      minified_phantomjs: {
        browsers: ['PhantomJS'],
        configFile: 'test/karma.minified.conf.js'
      },

      // This is all the minified api tests run locally on local browsers
      minified_api_dev: {
        browsers: ['Chrome', 'Firefox', 'Safari'],
        configFile: 'test/karma.minified.api.conf.js'
      },
      minified_api_chromecanary: {
        browsers: ['ChromeCanary'],
        configFile: 'test/karma.minified.api.conf.js'
      },
      minified_api_chrome: {
        browsers: ['Chrome'],
        configFile: 'test/karma.minified.api.conf.js'
      },
      minified_api_firefox: {
        browsers: ['Firefox'],
        configFile: 'test/karma.minified.api.conf.js'
      },
      minified_api_safari: {
        browsers: ['Safari'],
        configFile: 'test/karma.minified.api.conf.js'
      },
      minified_api_ie: {
        browsers: ['IE'],
        configFile: 'test/karma.minified.api.conf.js'
      },
      minified_api_phantomjs: {
        browsers: ['PhantomJS'],
        configFile: 'test/karma.minified.api.conf.js'
      }
    },
    vjsdocs: {
      all: {
        src: sourceFiles,
        dest: 'docs/api',
        options: {
          baseURL: 'https://github.com/videojs/video.js/blob/master/'
        }
      }
    },
    vjslanguages: {
      defaults: {
        files: {
          'build/files/lang': ['lang/*.json']
        }
      }
    },
    zip: {
      dist: {
        router: function (filepath) {
          var path = require('path');
          return path.relative('dist', filepath);
        },
        // compression: 'DEFLATE',
        src: ['dist/video-js/**/*'],
        dest: 'dist/video-js-' + version.full + '.zip'
      }
    },
    usebanner: {
      dist: {
        options: {
          position: 'top',
          banner: '/*! Video.js v' + version.full + ' <%= pkg.copyright %> */ ',
          linebreak: true
        },
        files: {
          src: [ 'build/files/minified.video.js']
        }
      }
    },
    version: {
      options: {
        pkg: 'package.json'
      },
      major: {
        options: {
          release: 'major'
        },
        src: ['package.json', 'bower.json', 'component.json']
      },
      minor: {
        options: {
          release: 'minor'
        },
        src: ['package.json', 'bower.json', 'component.json']
      },
      patch: {
        options: {
          release: 'patch'
        },
        src: ['package.json', 'bower.json', 'component.json']
      }
    },
    tagrelease: {
      file: 'package.json',
      commit:  true,
      message: 'Release %version%',
      prefix:  'v'
    }
  });

  grunt.loadNpmTasks('grunt-videojs-languages');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-s3');
  grunt.loadNpmTasks('contribflow');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('videojs-doc-generator');
  grunt.loadNpmTasks('grunt-zip');
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-version');
  grunt.loadNpmTasks('grunt-tagrelease');
  grunt.loadNpmTasks('chg');

  // grunt.loadTasks('./docs/tasks/');
  // grunt.loadTasks('../videojs-doc-generator/tasks/');

  grunt.registerTask('pretask', ['jshint', 'less', 'vjslanguages', 'build', 'minify', 'usebanner']);
  // Default task.
  grunt.registerTask('default', ['pretask', 'dist']);
  // Development watch task
  grunt.registerTask('dev', ['jshint', 'less', 'vjslanguages', 'build', 'qunit:source']);
  grunt.registerTask('test-qunit', ['pretask', 'qunit']);

  // The test task will run `karma:saucelabs` when running in travis,
  // when running via a PR from a fork, it'll run qunit tests in phantom using
  // karma otherwise, it'll run the tests in chrome via karma
  // You can specify which browsers to build with by using grunt-style arguments
  // or separating them with a comma:
  //   grunt test:chrome:firefox  # grunt-style
  //   grunt test:chrome,firefox  # comma-separated
  grunt.registerTask('test', function() {
    var tasks = this.args,
        tasksMinified,
        tasksMinifiedApi;

    grunt.task.run(['pretask']);

    if (process.env.TRAVIS_PULL_REQUEST !== 'false') {
      grunt.task.run(['karma:phantomjs', 'karma:minified_phantomjs', 'karma:minified_api_phantomjs']);
    } else if (process.env.TRAVIS) {
      grunt.task.run(['karma:phantomjs', 'karma:minified_phantomjs', 'karma:minified_api_phantomjs']);
      //Disabling saucelabs until we figure out how to make it run reliably.
      //grunt.task.run([
        //'karma:chrome_sl',
        //'karma:firefox_sl',
        //'karma:safari_sl',
        //'karma:ipad_sl',
        //'karma:android_sl',
        //'karma:ie_sl'
      //]);
    } else {
      // if we aren't running this in a CI, but running it manually, we can
      // supply arguments to this task. These arguments are either colon (`:`)
      // separated which is the default grunt separator for arguments, or they
      // are comma (`,`) separated to make it easier.
      // The arguments are the names of which browsers you want. It'll then
      // make sure you have the `minified` and `minified_api` for those browsers
      // as well.
      if (tasks.length === 0) {
        tasks.push('chrome');
      }
      if (tasks.length === 1) {
        tasks = tasks[0].split(',');
      }

      tasksMinified = tasks.slice();
      tasksMinifiedApi = tasks.slice();

      tasksMinified = tasksMinified.map(function(task) {
        return 'minified_' + task;
      });

      tasksMinifiedApi = tasksMinifiedApi.map(function(task) {
        return 'minified_api_' + task;
      });

      tasks = tasks.concat(tasksMinified).concat(tasksMinifiedApi);
      tasks = tasks.map(function(task) {
        return 'karma:' + task;
      });

      grunt.task.run(tasks);
    }
  });

  grunt.registerTask('saucelabs', function() {
    var done = this.async();

    if (this.args[0] == 'connect') {
      exec('curl https://gist.githubusercontent.com/santiycr/5139565/raw/sauce_connect_setup.sh | bash',
        function(error, stdout, stderr) {
          if (error) {
            grunt.log.error(error);
            return done();
          }

          grunt.verbose.error(stderr.toString());
          grunt.verbose.writeln(stdout.toString());
          grunt.task.run(['karma:saucelabs']);
          done();
      });
    } else {
      grunt.task.run(['karma:saucelabs']);
      done();
    }
  });

  var fs = require('fs');

  grunt.registerMultiTask('build', 'Building Source', function(){

    // Fix windows file path delimiter issue
    var i = sourceFiles.length;
    while (i--) {
      sourceFiles[i] = sourceFiles[i].replace(/\\/g, '/');
    }

    // Create a combined sources file. https://github.com/zencoder/video-js/issues/287
    var combined = '';
    sourceFiles.forEach(function(result){
      combined += grunt.file.read(result);
    });
    // Replace CDN version ref in js. Use major/minor version.
    combined = combined.replace(/GENERATED_CDN_VSN/g, version.majorMinor);

    grunt.file.write('build/files/combined.video.js', combined);

    // Copy over other files
    // grunt.file.copy('src/css/video-js.png', 'build/files/video-js.png');
    grunt.file.copy('node_modules/videojs-swf/dist/video-js.swf', 'build/files/video-js.swf');

    // Inject version number into css file
    var css = grunt.file.read('build/files/video-js.css');
    css = css.replace(/GENERATED_AT_BUILD/g, version.full);
    grunt.file.write('build/files/video-js.css', css);

    // Copy over font files
    grunt.file.recurse('src/css/font', function(absdir, rootdir, subdir, filename) {
      // Block .DS_Store files
      if ('filename'.substring(0,1) !== '.') {
        grunt.file.copy(absdir, 'build/files/font/' + filename);
      }
    });

    // Minify CSS
    grunt.task.run(['cssmin']);
  });

  grunt.registerMultiTask('minify', 'Minify JS files using Closure Compiler.', function() {
    var done = this.async();
    var exec = require('child_process').exec;

    var externs = this.data.externs || [];
    var dest = this.data.dest;
    var filePatterns = [];

    // Make sure deeper directories exist for compiler
    grunt.file.write(dest, '');

    if (this.data.sourcelist) {
      filePatterns = filePatterns.concat(grunt.file.read(this.data.sourcelist).split(','));
    }
    if (this.data.src) {
      filePatterns = filePatterns.concat(this.data.src);
    }

    // Build closure compiler shell command
    var command = 'java -jar build/compiler/compiler.jar'
                + ' --compilation_level ADVANCED_OPTIMIZATIONS'
                // + ' --formatting=pretty_print'
                + ' --js_output_file=' + dest
                + ' --create_source_map ' + dest + '.map --source_map_format=V3'
                + ' --jscomp_warning=checkTypes --warning_level=VERBOSE'
                + ' --output_wrapper "(function() {%output%})();"';
                //@ sourceMappingURL=video.js.map

    // Add each js file
    grunt.file.expand(filePatterns).forEach(function(file){
      command += ' --js='+file;
    });

    // Add externs
    externs.forEach(function(extern){
      command += ' --externs='+extern;
    });

    // Run command
    exec(command, { maxBuffer: 500*1024 }, function(err, stdout, stderr){

      if (err) {
        grunt.warn(err);
        done(false);
      }

      if (stdout) {
        grunt.log.writeln(stdout);
      }

      done();
    });
  });

  grunt.registerTask('dist-copy', 'Assembling distribution', function(){
    var css, jsmin, jsdev, cdnjs;

    // Manually copy each source file
    grunt.file.copy('build/files/minified.video.js', 'dist/video-js/video.js');
    grunt.file.copy('build/files/combined.video.js', 'dist/video-js/video.dev.js');
    grunt.file.copy('build/files/video-js.css', 'dist/video-js/video-js.css');
    grunt.file.copy('build/files/video-js.min.css', 'dist/video-js/video-js.min.css');
    grunt.file.copy('node_modules/videojs-swf/dist/video-js.swf', 'dist/video-js/video-js.swf');
    grunt.file.copy('build/demo-files/demo.html', 'dist/video-js/demo.html');
    grunt.file.copy('build/demo-files/demo.captions.vtt', 'dist/video-js/demo.captions.vtt');
    grunt.file.copy('src/css/video-js.less', 'dist/video-js/video-js.less');


    // Copy over font files
    grunt.file.recurse('build/files/font', function(absdir, rootdir, subdir, filename) {
      // Block .DS_Store files
      if ('filename'.substring(0,1) !== '.') {
        grunt.file.copy(absdir, 'dist/video-js/font/' + filename);
      }
    });

    // Copy over language files
    grunt.file.recurse('build/files/lang', function(absdir, rootdir, subdir, filename) {
      // Block .DS_Store files
      if ('filename'.substring(0,1) !== '.') {
        grunt.file.copy(absdir, 'dist/cdn/lang/' + filename);
        grunt.file.copy(absdir, 'dist/video-js/lang/' + filename);
      }
    });

    // ds_store files sometime find their way in
    if (grunt.file.exists('dist/video-js/.DS_Store')) {
      grunt.file['delete']('dist/video-js/.DS_Store');
    }

    // CDN version uses already hosted font files
    // Minified version only, doesn't need demo files
    grunt.file.copy('build/files/minified.video.js', 'dist/cdn/video.js');
    grunt.file.copy('build/files/video-js.min.css', 'dist/cdn/video-js.css');
    grunt.file.copy('node_modules/videojs-swf/dist/video-js.swf', 'dist/cdn/video-js.swf');
    grunt.file.copy('build/demo-files/demo.captions.vtt', 'dist/cdn/demo.captions.vtt');
    grunt.file.copy('build/demo-files/demo.html', 'dist/cdn/demo.html');

    // Replace font urls with CDN versions
    css = grunt.file.read('dist/cdn/video-js.css');
    css = css.replace(/font\//g, '../f/3/');
    grunt.file.write('dist/cdn/video-js.css', css);

    // Add CDN-specfic JS
    jsmin = grunt.file.read('dist/cdn/video.js');
    // GA Tracking Pixel (manually building the pixel URL)
    cdnjs = uglify.minify('src/js/cdn.js').code.replace('v0.0.0', 'v'+version.full);
    grunt.file.write('dist/cdn/video.js', jsmin + cdnjs);
  });

  grunt.registerTask('cdn-links', 'Update the version of CDN links in docs', function(){
    var doc = grunt.file.read('docs/guides/setup.md');
    var version = pkg.version;

    // remove the patch version to point to the latest patch
    version = version.replace(/(\d+\.\d+)\.\d+/, '$1');

    // update the version in http://vjs.zencdn.net/4.3/video.js
    doc = doc.replace(/(\/\/vjs\.zencdn\.net\/)\d+\.\d+(\.\d+)?/g, '$1'+version);
    grunt.file.write('docs/guides/setup.md', doc);
  });

  grunt.registerTask('dist', 'Creating distribution', ['dist-copy', 'zip:dist']);

  grunt.registerTask('next-issue', 'Get the next issue that needs a response', function(){
    var done = this.async();
    var GitHubApi = require('github');
    var open = require('open');

    var github = new GitHubApi({
        // required
        version: '3.0.0',
        // optional
        debug: true,
        protocol: 'https',
        // host: 'github.my-GHE-enabled-company.com',
        // pathPrefix: '/api/v3', // for some GHEs
        timeout: 5000
    });

    github.issues.repoIssues({
        // optional:
        // headers: {
        //     'cookie': 'blahblah'
        // },
        user: 'videojs',
        repo: 'video.js',
        sort: 'updated',
        direction: 'asc',
        state: 'open',
        per_page: 100
    }, function(err, res) {
      var issueToOpen;
      var usersWithWrite = ['heff', 'mmcc'];
      var categoryLabels = ['enhancement', 'bug', 'question', 'feature'];

      console.log('Number of issues: '+res.length);

      // TODO: Find the best way to exclude an issue where a question has been asked of the
      // issue owner/submitter that hasn't been answerd yet.
      // A stupid simple first step would be to check for the needs: more info label
      // and exactly one comment (the question)

      // find issues that need categorizing, no category labels
      res.some(function(issue){
        if (issue.labels.length === 0) {
          return issueToOpen = issue; // break
        }
        // look for category labels
        var categorized = issue.labels.some(function(label){
          return categoryLabels.indexOf(label.name) >= 0;
        });
        if (!categorized) {
          return issueToOpen = issue; // break
        }
      });
      if (issueToOpen) {
        open(issueToOpen.html_url);
        return done();
      }

      // find issues that need confirming or answering
      res.some(function(issue){
        // look for confirmed label
        var confirmed = issue.labels.some(function(label){
          return label.name === 'confirmed';
        });
        // Was exluding questions, but that might leave a lot of people hanging
        // var question = issue.labels.some(function(label){
        //   return label.name === 'question';
        // });
        if (!confirmed) { //  && !question
          return issueToOpen = issue; // break
        }
      });
      if (issueToOpen) {
        open(issueToOpen.html_url);
        return done();
      }

      grunt.log.writeln('No next issue found');
      done();
    });
  });

};
