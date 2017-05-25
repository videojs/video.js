import {gruntCustomizer, gruntOptionsMaker} from './options-customizer.js';
import chg from 'chg';
import npmRun from 'npm-run';
import isDocsOnly from './docs-only.js';

module.exports = function(grunt) {
  require('time-grunt')(grunt);

  let _ = require('lodash');
  let pkg = grunt.file.readJSON('package.json');
  let license = grunt.file.read('build/license-header.txt');
  let bannerCommonData = _.pick(pkg, ['version', 'copyright']);
  let verParts = pkg.version.split('.');
  let version = {
    full: pkg.version,
    major: verParts[0],
    minor: verParts[1],
    patch: verParts[2]
  };

  const browserifyGruntDefaults = {
    browserifyOptions: {
      standalone: 'videojs'
    },
    plugin: [
      ['bundle-collapser/plugin'],
      ['browserify-derequire']
    ]
  };

  const githubReleaseDefaults = {
    options: {
      release: {
        tag_name: 'v'+ version.full,
        name: version.full,
        body: npmRun.execSync('conventional-changelog -p videojs', {
          silent: true,
          encoding: 'utf8'
        })
      },
    },
    files: {
      src: [`dist/video-js-${version.full}.zip`] // Files that you want to attach to Release
    }
  };

  /**
   * Customizes _.merge behavior in `browserifyGruntOptions` to concatenate
   * arrays. This can be overridden on a per-call basis to
   *
   * @see https://lodash.com/docs#merge
   * @function browserifyGruntCustomizer
   * @private
   * @param  {Mixed} objectValue
   * @param  {Mixed} sourceValue
   * @return {Object}
   */
  const browserifyGruntCustomizer = gruntCustomizer;

  /**
   * Creates a unique object of Browserify Grunt task options.
   *
   * @function browserifyGruntOptions
   * @private
   * @param  {Object} [options]
   * @param  {Function} [customizer=browserifyGruntCustomizer]
   *         If the default array-concatenation behavior is not desireable,
   *         pass _.noop or a unique customizer (https://lodash.com/docs#merge).
   *
   * @return {Object}
   */
  const browserifyGruntOptions = gruntOptionsMaker(browserifyGruntDefaults, browserifyGruntCustomizer);

  const githubReleaseCustomizer = gruntCustomizer;
  const githubReleaseOptions = gruntOptionsMaker(githubReleaseDefaults, githubReleaseCustomizer);

  /**
   * Creates processor functions for license banners.
   *
   * @function createLicenseProcessor
   * @private
   * @param  {Object} data Custom data overriding `bannerCommonData`. Will
   *                       not be mutated.
   * @return {Function}    A function which returns a processed grunt template
   *                       using an object constructed from `bannerCommonData`
   *                       and the `data` argument.
   */
  function createLicenseProcessor(data) {
    return () => {
      return grunt.template.process(license, {
        data: _.merge({}, bannerCommonData, data)
      });
    };
  }

  version.majorMinor = `${version.major}.${version.minor}`;
  grunt.vjsVersion = version;

  // Project configuration.
  grunt.initConfig({
    pkg,
    clean: {
      build: ['build/temp/*', 'es5'],
      dist: ['dist/*']
    },
    uglify: {
      options: {
        preserveComments: 'some',
        screwIE8: false,
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
          'build/temp/alt/video.novtt.min.js': 'build/temp/alt/video.novtt.js',
          'build/temp/video.min.js': 'build/temp/video.js'
        }
      }
    },
    dist: {},
    watch: {
      dist: {
        files: [
          'build/temp/video.js',
          'build/temp/alt/video.novtt.js',
          'build/temp/video-js.css',
          'build/temp/alt/video-js-cdn.css'
        ],
        tasks: ['copy:dist']
      },
      minify: {
        files: ['build/temp/video.js'],
        tasks: ['uglify']
      },
      skin: {
        files: ['src/css/**/*'],
        tasks: ['skin']
      },
      lang: {
        files: ['lang/**/*.json'],
        tasks: ['vjslanguages']
      }
    },
    connect: {
      dev: {
        options: {
          port: Number(process.env.VJS_CONNECT_PORT) || 9999,
          livereload: true,
          useAvailablePort: true
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
      dist:  { cwd: 'build/temp/', src: ['**/**', '!test*'], dest: 'dist/', expand: true, filter: 'isFile' },
      a11y:  { src: 'sandbox/descriptions.html.example', dest: 'sandbox/descriptions.test-a11y.html' }, // Can only test a file with a .html or .htm extension
      examples: { cwd: 'docs/examples/', src: ['**/**'], dest: 'dist/examples/', expand: true, filter: 'isFile' }
    },
    cssmin: {
      minify: {
        expand: true,
        cwd: 'build/temp/',
        src: ['video-js.css', 'alt/video-js-cdn.css'],
        dest: 'build/temp/',
        ext: '.min.css'
      }
    },
    sass: {
      build: {
        files: {
          'build/temp/video-js.css': 'src/css/vjs.scss',
          'build/temp/alt/video-js-cdn.css': 'src/css/vjs-cdn.scss'
        }
      }
    },
    karma: {
      // this config file applies to all following configs except if overwritten
      options: {
        configFile: 'test/karma.conf.js'
      },

      defaults: {
        detectBrowsers: {
          enabled: !process.env.TRAVIS,
          usePhantomJS: false
        }
      },

      watch: {
        autoWatch: true,
        singleRun: false
      },

      // these are run locally on local browsers
      dev: { browsers: ['Chrome', 'Firefox', 'Safari'] },
      chromecanary: { browsers: ['ChromeCanary'] },
      chrome:       { browsers: ['Chrome'] },
      firefox:      { browsers: ['Firefox'] },
      safari:       { browsers: ['Safari'] },
      ie:           { browsers: ['IE'] },

      // this only runs on PRs from the mainrepo on BrowserStack
      browserstack: { browsers: ['chrome_bs'] },
      chrome_bs:    { browsers: ['chrome_bs'] },
      firefox_bs:   { browsers: ['firefox_bs'] },
      safari_bs:    { browsers: ['safari_bs'] },
      edge_bs:      { browsers: ['edge_bs'] },
      ie11_bs:      { browsers: ['ie11_bs'] },
      ie10_bs:      { browsers: ['ie10_bs'] },
      ie9_bs:       { browsers: ['ie9_bs'] },
      ie8_bs:       { browsers: ['ie8_bs'] }
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
        src: ['package.json']
      },
      minor: {
        options: {
          release: 'minor'
        },
        src: ['package.json']
      },
      patch: {
        options: {
          release: 'patch'
        },
        src: ['package.json']
      },
      prerelease: {
        options: {
          release: 'prerelease'
        },
        src: ['package.json']
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
        }
      },
      release: githubReleaseOptions(),
      prerelease: githubReleaseOptions({
        options: {
          release: {
            prerelease: true
          }
        }
      })
    },
    babel: {
      es5: {
        files: [{
          expand: true,
          cwd: 'src/js/',
          src: ['**/*.js', '!base-styles.js'],
          dest: 'es5/'
        }]
      }
    },
    browserify: {
      build: {
        options: browserifyGruntOptions(),
        files: {
          'build/temp/video.js': ['es5/video.js']
        }
      },
      buildnovtt: {
        options: browserifyGruntOptions({transform: [
          ['aliasify', {aliases: {'videojs-vtt.js': false}}]
        ]}),
        files: {
          'build/temp/alt/video.novtt.js': ['es5/video.js']
        }
      },
      watch: {
        options: browserifyGruntOptions({
          watch: true,
          keepAlive: true,
        }),
        files: {
          'build/temp/video.js': ['es5/video.js']
        }
      },
      watchnovtt: {
        options: browserifyGruntOptions({
          transform: [
            ['aliasify', {aliases: {'videojs-vtt.js': false}}]
          ],
          watch: true,
          keepAlive: true,
        }),
        files: {
          'build/temp/alt/video.novtt.js': ['es5/video.js']
        }
      },
      tests: {
        options: {
          browserifyOptions: {
            verbose: true,
            standalone: false,
            transform: ['babelify']
          },
          plugin: [
            ['proxyquireify/plugin', 'bundle-collapser/plugin']
          ],
          banner: false,
          watch: true,
          keepAlive: true
        },
        files: {
          'build/temp/tests.js': [
            'test/globals-shim.js',
            'test/unit/**/*.js'
          ]
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
      options: {
        separator: '\n'
      },
      ie8_addition: {
        src: ['build/temp/video-js.css', 'src/css/ie8.css'],
        dest: 'build/temp/video-js.css'
      }
    },
    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      tests: [
        'shell:babel',
        'browserify:tests'
      ],
      dev: [
        'shell:babel',
        'shell:rollupwatch',
        'browserify:tests',
        'watch:skin',
        'watch:lang',
        'watch:dist'
      ],
      // Run multiple watch tasks in parallel
      // Needed so watchify can cache intelligently
      watchAll: [
        'watch',
        'browserify:watch',
        'browserify:watchnovtt',
        'browserify:tests',
        'karma:watch'
      ],
      watchSandbox: [
        'watch',
        'browserify:watch'
      ]
    },
    usebanner: {
      novtt: {
        options: {
          process: createLicenseProcessor({includesVtt: false})
        },
        files: {
          src: ['build/temp/alt/video.novtt.js']
        }
      },
      vtt: {
        options: {
          process: createLicenseProcessor({includesVtt: true})
        },
        files: {
          src: ['build/temp/video.js']
        }
      }
    },
    shell: {
      rollup: {
        command: 'npm run rollup',
        options: {
          preferLocal: true
        }
      },
      rollupall: {
        command: 'npm run rollup -- --no-progress && npm run rollup-minify -- --no-progress',
        options: {
          preferLocal: true
        }
      },
      rollupwatch: {
        command: 'npm run rollup-dev',
        optoins: {
          preferLocal: true
        }
      },
      babel: {
        command: 'npm run babel -- --watch',
        options: {
          preferLocal: true
        }
      },
      lint: {
        command: 'npm run lint -- --errors',
        options: {
          preferLocal: true
        }
      },
      noderequire: {
        command: 'node test/require/node.js',
        options: {
          failOnError: true
        }
      },
      browserify: {
        command: 'browserify test/require/browserify.js -o build/temp/browserify.js',
        options: {
          preferLocal: true
        }
      },
      webpack: {
        command: 'webpack --hide-modules test/require/webpack.js build/temp/webpack.js',
        options: {
          preferLocal: true
        }
      }
    },
    accessibility: {
      options: {
        accessibilityLevel: 'WCAG2AA',
        reportLevels: {
          notice: false,
          warning: true,
          error: true
        },
        ignore: [
          // Ignore warning about contrast of the "vjs-no-js" fallback link
          'WCAG2AA.Principle1.Guideline1_4.1_4_3.G18.BgImage'
        ]

      },
      test: {
        src: ['sandbox/descriptions.test-a11y.html']
      }
    }
  });

  // load all the npm grunt tasks
  require('load-grunt-tasks')(grunt);
  grunt.loadNpmTasks('videojs-doc-generator');
  grunt.loadNpmTasks('chg');
  grunt.loadNpmTasks('grunt-accessibility');

  grunt.registerTask('build', [
    'shell:lint',
    'clean:build',

    'shell:rollupall',

    'skin',
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

  grunt.registerTask('skin', ['sass', 'concat:ie8_addition']);

  // Default task - build and test
  grunt.registerTask('default', ['test']);

  // The test script includes coveralls only when the TRAVIS env var is set.
  grunt.registerTask('test', function() {
    const tasks = [
      'build',
      'shell:noderequire',
      'shell:browserify',
      'shell:webpack',
      'karma:defaults',
      'test-a11y'
    ];

    if (process.env.TRAVIS) {
      if (isDocsOnly(process.env.TRAVIS_COMMIT, process.env.TRAVIS_COMMIT_RANGE)) {
        grunt.log.write('Not running any tests because only docs were changed');
        return;
      }

      tasks.concat(process.env.TRAVIS && 'coveralls').filter(Boolean);
    }

    grunt.task.run(tasks);
  });

  // Run while developing
  grunt.registerTask('dev', ['connect:dev', 'concurrent:dev']);
  grunt.registerTask('watchAll', ['build', 'connect:dev', 'concurrent:watchAll']);
  grunt.registerTask('test-a11y', ['copy:a11y', 'accessibility']);

  // Pick your testing, or run both in different terminals
  grunt.registerTask('test-ui', ['browserify:tests']);
  grunt.registerTask('test-cli', ['karma:watch']);

  // Load all the tasks in the tasks directory
  grunt.loadTasks('build/tasks');
};
