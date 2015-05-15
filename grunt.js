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
            ['WIN8.1', 'chrome', ''],
            // TODO: Find out and fix IE and FF on Linux timeouts
            // ['Linux', 'firefox', ''],
            // ['WIN8.1', 'internet explorer', ''],
            ['OS X 10.10', 'safari', ''],
            ['', 'iPad', '8.2'],
            ['', 'Android', '']
          ],
          tunneled: false,
          build: process.env.TRAVIS_BUILD_NUMBER,
          testname: process.env.TRAVIS_BUILD_NUMBER + process.env.TRAVIS_BRANCH,
          throttled: 3,
          sauceConfig: {
            tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
          }
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
      prerelease: {
        options: {
          release: 'prerelease'
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
  grunt.registerTask('default', ['build', 'test-local']);

  // Development watch task. Doing the minimum required.
  grunt.registerTask('dev', ['connect:dev', 'jshint', 'sass', 'browserify:build', 'karma:chrome']);

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
