module.exports = function(grunt) {
  require('time-grunt')(grunt);

  let pkg = grunt.file.readJSON('package.json');
  let license = grunt.file.read('build/license-header.txt');
  let verParts = pkg.version.split('.');
  let version = {
    full: pkg.version,
    major: verParts[0],
    minor: verParts[1],
    patch: verParts[2]
  };

  version.majorMinor = `${version.major}.${version.minor}`;
  grunt.vjsVersion = version;

  // Project configuration.
  grunt.initConfig({
    pkg,
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
      default: {
        files: [ 'src/**/*', 'test/unit/**/*.js', 'Gruntfile.js' ],
        tasks: 'dev'
      },
      skin: {
        files: ['src/css/**/*'],
        tasks: 'sass'
      }
    },
    connect: {
      preview: {
        options: {
          port: 9999,
          keepalive: true
        }
      },
      dev: {
        options: {
          port: 9999,
          livereload: true
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
      fonts: { cwd: 'node_modules/videojs-font/fonts/', src: ['*'], dest: 'build/temp/font/', expand: true, filter: 'isFile' },
      swf:   { cwd: 'node_modules/videojs-swf/dist/', src: 'video-js.swf', dest: 'build/temp/', expand: true, filter: 'isFile' },
      ie8:   { cwd: 'node_modules/videojs-ie8/dist/', src: ['**/**'], dest: 'build/temp/ie8/', expand: true, filter: 'isFile' },
      novtt: { cwd: 'build/temp/', src: 'video.novtt.js', dest: 'build/temp/alt/', expand: true, filter: 'isFile' },
      dist:  { cwd: 'build/temp/', src: ['**/**', '!test*'], dest: 'dist/', expand: true, filter: 'isFile' },
      examples: { cwd: 'docs/examples/', src: ['**/**'], dest: 'dist/examples/', expand: true, filter: 'isFile' }
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
    sass: {
      dist: {
        files: {
          'build/temp/video-js.css': 'src/css/video-js.scss'
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
    },
    // this only runs on PRs from the mainrepo on saucelabs
    'saucelabs-qunit': {
      all: {
        options: {
          urls: ['http://127.0.0.1:9999/test/index.html'],
          browsers: [
            /* [platform, browserName, version] - version will default to latest stable version */
            ['OS X 10.10', 'safari', ''],
            ['WIN8.1', 'chrome', ''],
            ['WIN8.1', 'internet explorer', ''],
            ['', 'iPad', '8.2'],
            ['', 'Android', '']
          ],
          tunneled: true,
          build: process.env.TRAVIS_BUILD_NUMBER,
          testname: process.env.TRAVIS_BUILD_NUMBER + process.env.TRAVIS_BRANCH,
          throttled: 3,
          'max-duration': 500,
          maxRetries: 3
        }
      }
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
        src: ['package.json', 'component.json']
      },
      minor: {
        options: {
          release: 'minor'
        },
        src: ['package.json', 'component.json']
      },
      patch: {
        options: {
          release: 'patch'
        },
        src: ['package.json', 'component.json']
      },
      prerelease: {
        options: {
          release: 'prerelease'
        },
        src: ['package.json', 'component.json']
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
        src: [`dist/video-js-${version.full}.zip`] // Files that you want to attach to Release
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
          plugin: [
            [ 'browserify-derequire' ]
          ],
          transform: [
            require('babelify').configure({
              sourceMapRelative: './src/js',
              loose: 'all'
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
      },
      test: {
        files: {
          'build/temp/tests.js': [
            'test/globals-shim.js',
            'test/unit/**/*.js'
          ]
        },
        options: {
          browserifyOptions: {
            debug: true,
            standalone: 'videojs'
          },
          transform: [
            require('babelify').configure(),
            'browserify-istanbul'
          ]
        }
      },
      watch: {
        files: {
          'build/temp/video.js': ['src/js/video.js'],
          'build/temp/tests.js': [
            'test/globals-shim.js',
            'test/unit/**/*.js'
          ]
        },
        options: {
          watch: true,
          keepAlive: true,
          browserifyOptions: {
            standalone: 'videojs'
          },
          banner: license,
          transform: ['babelify'],
          plugin: [
            [ 'browserify-derequire' ]
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
      options: {
        // warn instead of failing when coveralls errors
        // we've seen coveralls 503 relatively frequently
        force: true
      },
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

  // load all the npm grunt tasks
  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('videojs-doc-generator');
  grunt.loadNpmTasks('chg');

  grunt.registerTask('build', [
    'clean:build',
    'jshint',
    'browserify:build',
    'browserify:test',
    'copy:novtt',
    'concat:vtt',
    'exorcise',
    'uglify',
    'sass',
    'version:css',
    'cssmin',
    'copy:fonts',
    'copy:swf',
    'copy:ie8',
    'vjslanguages'
  ]);

  grunt.registerTask('dist', [
    'clean:dist',
    'build',
    'copy:dist',
    'copy:examples',
    'zip:dist'
  ]);

  // Remove this and add to the test task once mmcc's coverall changes are merged
  grunt.registerTask('newtest', ['build', 'karma:chrome']);

  // Default task.
  grunt.registerTask('default', ['build', 'test-local']);

  // Development watch task. Doing the minimum required.
  grunt.registerTask('dev', ['jshint', 'sass', 'browserify:build', 'karma:chrome']);

  // Skin development watch task.
  grunt.registerTask('skin-dev', ['connect:dev', 'watch:skin']);

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
