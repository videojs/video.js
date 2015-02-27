module.exports = function(grunt) {
  var pkg, version, verParts;

  pkg = grunt.file.readJSON('package.json');

  verParts = pkg.version.split('.');
  version = {
    full: pkg.version,
    major: verParts[0],
    minor: verParts[1],
    patch: verParts[2]
  };
  version.majorMinor = version.major + '.' + version.minor;
  grunt.vjsVersion = version;

  // loading predefined source order from source-loader.js
  // trust me, this is the easist way to do it so far
  /*jshint undef:false, evil:true */
  var blockSourceLoading = true;
  var sourceFiles; // Needed to satisfy jshint
  eval(grunt.file.read('./build/source-loader.js'));

  grunt.sourceFiles = sourceFiles;

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
    aws_s3: {
      options: {
        accessKeyId: process.env.VJS_S3_KEY,
        secretAccessKey: process.env.VJS_S3_SECRET,
        bucket: process.env.VJS_S3_BUCKET,
        access: 'public-read',
        uploadConcurrency: 5
      },
      patch: {
        files: [
          {
            expand: true,
            cwd: 'dist/cdn/',
            src: ['**'],
            dest: 'vjs/'+version.full+'/',
            params: { CacheControl: 'public, max-age=31536000' }
          }
        ]
      },
      minor: {
        files: [
          {
            expand: true,
            cwd: 'dist/cdn/',
            src: ['**'],
            dest: 'vjs/'+version.majorMinor+'/',
            params: { CacheControl: 'public, max-age=2628000' }
          }
        ]
      }
    },
    fastly: {
      options: {
        key: process.env.VJS_FASTLY_API_KEY
      },
      minor: {
        options: {
          host: 'vjs.zencdn.net',
          urls: [
            version.majorMinor+'/*'
          ]
        }
      },
      patch: {
        options: {
          host: 'vjs.zencdn.net',
          urls: [
            version.full+'/*'
          ]
        }
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
    'github-release': {
      options: {
        repository: 'videojs/video.js',
        auth: {
          user: process.env.VJS_GITHUB_USER,
          password: process.env.VJS_GITHUB_TOKEN
        },
        release: {
          tag_name: 'v'+ version.full,
          name: version.full,
          body: require('chg').find(version.full).changesRaw
        }
      },
      files: {
        src: ['dist/video-js-'+ version.full +'.zip'] // Files that you want to attach to Release
      }
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
  grunt.loadNpmTasks('contribflow');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('videojs-doc-generator');
  grunt.loadNpmTasks('grunt-zip');
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-version');
  grunt.loadNpmTasks('chg');
  grunt.loadNpmTasks('grunt-fastly');
  grunt.loadNpmTasks('grunt-github-releaser');
  grunt.loadNpmTasks('grunt-aws-s3');

  // grunt.loadTasks('./docs/tasks/');
  // grunt.loadTasks('../videojs-doc-generator/tasks/');

  grunt.registerTask('pretask', ['jshint', 'less', 'vjslanguages', 'build', 'minify', 'vttjs', 'usebanner']);
  // Default task.
  grunt.registerTask('default', ['pretask', 'dist']);
  // Development watch task
  grunt.registerTask('dev', ['jshint', 'less', 'vjslanguages', 'build', 'qunit:source']);
  grunt.registerTask('test-qunit', ['pretask', 'qunit']);

  grunt.registerTask('dist', 'Creating distribution', ['dist-copy', 'zip:dist']);

  // Load all the tasks in the tasks directory
  grunt.loadTasks('tasks');
};
