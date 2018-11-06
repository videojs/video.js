import isDocsOnly from './docs-only.js';

module.exports = function(grunt) {
  require('time-grunt')(grunt);

  const pkg = grunt.file.readJSON('package.json');
  const verParts = pkg.version.split('.');
  const version = {
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
      build: ['build/temp/*', 'es5', 'test/dist'],
      dist: ['dist/*', 'test/dist']
    },
    dist: {},
    watch: {
      lang: {
        files: ['lang/**/*.json'],
        tasks: ['vjslanguages']
      }
    },
    copy: {
      fonts: { cwd: 'node_modules/videojs-font/fonts/', src: ['*'], dest: 'build/temp/font/', expand: true, filter: 'isFile' },
      lang:  { cwd: 'lang/', src: ['*'], dest: 'dist/lang/', expand: true, filter: 'isFile' },
      dist:  { cwd: 'build/temp/', src: ['**/**', '!test*'], dest: 'dist/', expand: true, filter: 'isFile' },
      a11y:  { src: 'sandbox/descriptions.html.example', dest: 'sandbox/descriptions.test-a11y.html' }, // Can only test a file with a .html or .htm extension
      examples: { cwd: 'docs/examples/', src: ['**/**'], dest: 'dist/examples/', expand: true, filter: 'isFile' }
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
    concurrent: {
      options: {
        logConcurrentOutput: true
      },
      tests: [
        'shell:babel',
      ],
      dev: [
        'shell:sass',
        'shell:babel',
        'watch:lang',
        'copy:dist',
        'shell:karma-server'
      ],
      // Run multiple watch tasks in parallel
      // Needed so watchify can cache intelligently
      watchAll: [
        'watch',
        'shell:karma-server'
      ],
      watchSandbox: [
        'watch'
      ]
    },
    shell: {
      'karma-server': {
        command: 'npm run karma-server',
        options: {
          preferLocal: true
        }
      },
      'karma-run': {
        command: 'npm run karma-run',
        options: {
          preferLocal: true
        }
      },
      cssmin: {
        command: 'npm run cssmin',
        options: {
          preferLocal: true
        }
      },
      sass: {
        command: 'npm run sass',
        options: {
          preferLocal: true
        }
      },
      rollup: {
        command: 'npm run rollup',
        options: {
          preferLocal: true
        }
      },
      rollupall: {
        command: 'npm run rollup -- --no-progress && npm run minify',
        options: {
          preferLocal: true
        }
      },
      babel: {
        command: 'npm run babel -- --watch --quiet',
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
  grunt.loadNpmTasks('grunt-accessibility');

  grunt.registerTask('build', [
    'shell:lint',
    'clean:build',

    'shell:rollupall',

    'shell:sass',
    'shell:cssmin',

    'copy:fonts',
    'copy:lang',
    'vjslanguages'
  ]);

  grunt.registerTask('dist', [
    'clean:dist',
    'build',
    'copy:dist',
    'copy:examples',
    'zip:dist'
  ]);

  grunt.registerTask('skin', ['shell:sass']);

  // Default task - build and test
  grunt.registerTask('default', ['test']);

  grunt.registerTask('test', function() {
    const tasks = [
      'build',
      'shell:noderequire',
      'shell:browserify',
      'shell:webpack',
      'shell:karma-run',
      'test-a11y'
    ];

    if (process.env.TRAVIS) {
      if (isDocsOnly(process.env.TRAVIS_COMMIT, process.env.TRAVIS_COMMIT_RANGE)) {
        grunt.log.write('Not running any tests because only docs were changed');
        return;
      }
    }

    grunt.task.run(tasks);
  });

  // Run while developing
  grunt.registerTask('dev', ['sandbox', 'concurrent:dev']);
  grunt.registerTask('watchAll', ['build', 'concurrent:watchAll']);
  grunt.registerTask('test-a11y', ['copy:a11y', 'accessibility']);

  // Pick your testing, or run both in different terminals
  grunt.registerTask('test-ui', ['shell:karma-server']);
  grunt.registerTask('test-cli', ['shell:karma-server']);

  // Load all the tasks in the tasks directory
  grunt.loadTasks('build/tasks');
};
