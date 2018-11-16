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
        'shell:copy-dist',
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
      'copy-dist': {
        command: 'npm run copy-dist',
        options: {
          preferLocal: true
        }
      },
      'copy-fonts': {
        command: 'npm run copy-fonts',
        options: {
          preferLocal: true
        }
      },
      'lang': {
        command: 'npm run build:lang',
        options: {
          preferLocal: true
        }
      },
      'copy-examples': {
        command: 'npm run copy-examples',
        options: {
          preferLocal: true
        }
      },
      clean: {
        command: 'npm run clean',
        options: {
          preferLocal: true
        }
      },
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
      'zip': {
        command: 'npm run zip',
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
      a11y: {
        command: 'npm run test:a11y',
        options: {
          preferLocal: true
        }
      },
      noderequire: {
        command: 'npm run test:node-require',
        options: {
          preferLocal: true
        }
      },
      browserify: {
        command: 'npm run build:browserify-test',
        options: {
          preferLocal: true
        }
      },
      webpack: {
        command: 'npm run build:webpack-test',
        options: {
          preferLocal: true
        }
      }
    },
  });

  // load all the npm grunt tasks
  require('load-grunt-tasks')(grunt);

  grunt.registerTask('build', [
    'shell:lint',
    'shell:clean',

    'shell:rollupall',

    'shell:sass',
    'shell:cssmin',

    'shell:copy-fonts',
    'shell:lang'
  ]);

  grunt.registerTask('dist', [
    'build',
    'shell:copy-dist',
    'shell:copy-examples',
    'shell:zip'
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
      'shell:a11y'
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

  // Pick your testing, or run both in different terminals
  grunt.registerTask('test-ui', ['shell:karma-server']);
  grunt.registerTask('test-cli', ['shell:karma-server']);

  // Load all the tasks in the tasks directory
  grunt.loadTasks('build/tasks');
};
