module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');
  var license = grunt.file.read('build/license-header.txt');
  var verParts = pkg.version.split('.');
  var version = {
    full: pkg.version,
    major: verParts[0],
    minor: verParts[1],
    patch: verParts[2]
  };

  version.majorMinor = version.major + '.' + version.minor;
  grunt.vjsVersion = version;

  // Project configuration.
  grunt.initConfig({
    pkg: pkg,
    clean: {
      build: ['build/temp/*'],
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
    uglify: {
      options: {
        sourceMap: true,
        sourceMapIn: 'build/temp/video.js.map',
        sourceMapRoot: '../../src/js',
        preserveComments: 'some',
        mangle: true,
        compress: {
          sequences: true,
          dead_code: true,
          conditionals: true,
          booleans: true,
          unused: true,
          if_return: true,
          join_vars: true,
          drop_console: true
        }
      },
      build: {
        files: {
          'build/temp/video.min.js': 'build/temp/video.js'
        }
      }
    },
    dist: {},
    watch: {
      files: [ 'src/**/*', 'test/unit/**/*.js', 'Gruntfile.js' ],
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
          {expand: true, cwd: 'build/temp/', src: ['*'], dest: 'dist/'+version.majorMinor+'/', filter: 'isFile'} // includes files in path
        ]
      },
      patch: {
        files: [
          {expand: true, cwd: 'build/temp/', src: ['*'], dest: 'dist/'+version.full+'/', filter: 'isFile'} // includes files in path
        ]
      },
      fonts: { expand: true, cwd: 'src/css/font/', src: ['*'], dest: 'build/temp/font/', filter: 'isFile' },
      swf: { src: './node_modules/videojs-swf/dist/video-js.swf', dest: './build/temp/video-js.swf' },
      novtt: { src: './build/temp/video.js', dest: './build/temp/alt/video.novtt.js' },
      dist: { expand: true, cwd: 'build/temp/', src: ['**/**'], dest: 'dist/', filter: 'isFile' },
      examples: { expand: true, cwd: 'build/examples/', src: ['**/**'], dest: 'dist/examples/', filter: 'isFile' },
      cdn: { expand: true, cwd: 'dist/', src: ['**/**'], dest: 'dist/cdn/', filter: 'isFile' },
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
        cwd: 'build/temp/',
        src: ['video-js.css'],
        dest: 'build/temp/',
        ext: '.min.css'
      }
    },
    less: {
      dev: {
        files: {
          'build/temp/video-js.css': 'src/css/video-js.less'
        }
      }
    },
    karma: {
      // this config file applies to all following configs except if overwritten
      options: {
        configFile: 'test/karma.conf.js'
      },

      // these are run locally on local browsers
      dev: {
        browsers: ['Chrome', 'Firefox', 'Safari']
      },
      chromecanary: { browsers: ['ChromeCanary'] },
      chrome:       { browsers: ['Chrome'] },
      firefox:      { browsers: ['Firefox'] },
      safari:       { browsers: ['Safari'] },
      ie:           { browsers: ['IE'] },
      phantomjs:    { browsers: ['PhantomJS'] },

      // this only runs on PRs from the mainrepo on saucelabs
      saucelabs:  { browsers: ['chrome_sl'] },
      chrome_sl:  { browsers: ['chrome_sl'] },
      firefox_sl: { browsers: ['firefox_sl'] },
      safari_sl:  { browsers: ['safari_sl'] },
      ipad_sl:    { browsers: ['ipad_sl'] },
      android_sl: { browsers: ['android_sl'] },
      ie_sl:      { browsers: ['ie_sl'] }
    },
    vjsdocs: {
      all: {
        // TODO: Update vjsdocs to support new build, or switch to jsdoc
        src: '',
        dest: 'docs/api',
        options: {
          baseURL: 'https://github.com/videojs/video.js/blob/master/'
        }
      }
    },
    vjslanguages: {
      defaults: {
        files: {
          'build/temp/lang': ['lang/*.json']
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
        src: ['dist/**/*'],
        dest: 'dist/video-js-' + version.full + '.zip'
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
      },
      css: {
        options: {
          prefix: '@version\\s*'
        },
        src: 'build/temp/video-js.css'
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
    },
    browserify: {
      build: {
        files: {
          'build/temp/video.js': ['src/js/video.js']
        },
        options: {
          browserifyOptions: {
            debug: true,
            standalone: 'videojs'
          },
          banner: license,
          transform: [
            require('babelify').configure({
              sourceMapRelative: './src/js'
            }),
            ['browserify-versionify', {
              placeholder: '__VERSION__',
              version: pkg.version
            }],
            ['browserify-versionify', {
              placeholder: '__VERSION_NO_PATCH__',
              version: version.majorMinor
            }]
          ]
        }
      }
    },
    exorcise: {
      build: {
        options: {},
        files: {
          'build/temp/video.js.map': ['build/temp/video.js'],
        }
      }
    },
    coveralls: {
      all: {
        src: 'test/coverage/lcov.info'
      }
    },
    concat: {
      vtt: {
        options: {
          separator: '\n',
        },
        src: ['build/temp/video.js', 'node_modules/vtt.js/dist/vtt.js'],
        dest: 'build/temp/video.js',
      },
    }
  });

  grunt.loadNpmTasks('grunt-videojs-languages');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('videojs-doc-generator');
  grunt.loadNpmTasks('grunt-zip');
  grunt.loadNpmTasks('grunt-banner');
  grunt.loadNpmTasks('grunt-version');
  grunt.loadNpmTasks('chg');
  grunt.loadNpmTasks('grunt-fastly');
  grunt.loadNpmTasks('grunt-github-releaser');
  grunt.loadNpmTasks('grunt-aws-s3');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-coveralls');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-exorcise');

  grunt.registerTask('build', [
    'clean:build',
    'jshint',
    'browserify',
    'copy:novtt',
    'concat:vtt',
    'exorcise',
    'uglify',
    'less',
    'version:css',
    'cssmin',
    'copy:fonts',
    'copy:swf',
    'vjslanguages'
  ]);

  grunt.registerTask('dist', [
    'clean:dist',
    'build',
    'copy:dist',
    'copy:examples',
    'zip:dist'
  ]);

  grunt.registerTask('cdn', [
    'dist',
    'copy:cdn',
    'dist-cdn'
  ]);

  // Remove this and add to the test task once mmcc's coverall changes are merged
  grunt.registerTask('newtest', ['build', 'karma:chrome']);

  // Default task.
  grunt.registerTask('default', ['build', 'test']);

  // Development watch task. Doing the minimum required.
  grunt.registerTask('dev', ['jshint', 'less', 'browserify', 'karma:chrome']);

  // Tests.
  // We want to run things a little differently if it's coming from Travis vs local
  if (process.env.TRAVIS) {
    grunt.registerTask('test', ['build', 'test-travis', 'coveralls']);
  } else {
    grunt.registerTask('test', ['build', 'test-local']);
  }

  // Load all the tasks in the tasks directory
  grunt.loadTasks('build/tasks');
};
