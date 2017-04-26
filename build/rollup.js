import { rollup } from 'rollup';
import duration from 'humanize-duration';
import watch from 'rollup-watch';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import filesize from 'rollup-plugin-filesize';
import progress from 'rollup-plugin-progress';
import ignore from 'rollup-plugin-ignore';
import uglify from 'rollup-plugin-uglify';
import minimist from 'minimist';
import _ from 'lodash';

const args = minimist(process.argv.slice(2), {
  boolean: ['watch', 'minify'],
  alias: {
    w: 'watch',
    m: 'minify'
  }
});

const primedResolve = resolve({
  jsnext: true,
  main: true,
  browser: true
});
const primedCjs = commonjs({
  sourceMap: false
});
const primedBabel = babel({
  babelrc: false,
  exclude: ['node_modules/**', '/Users/gkatsevman/p/vtt.js/dist/vtt.js'],
  presets: [
    'es3',
    ['es2015', {
      loose: true,
      modules: false
    }]
  ],
  plugins: ['external-helpers']
});

const es = {
  options: {
    entry: 'src/js/video.js',
    plugins: [
      json(),
      primedBabel,
      progress(),
      filesize()
    ],
    onwarn(warning) {
      if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
        return;
      }
      if (warning.code === 'UNRESOLVED_IMPORT') {
        return;
      }

      // eslint-disable-next-line no-console
      console.warn(warning.message);
    }
  },
  format: 'es',
  dest: 'dist/videojs.rollup.es.js'
};

const cjs = Object.assign({}, es, {
  format: 'cjs',
  dest: 'dist/videojs.rollup.cjs.js'
});

const umd = {
  options: {
    entry: 'src/js/video.js',
    plugins: [
      primedResolve,
      json(),
      primedCjs,
      primedBabel,
      progress(),
      filesize()
    ]
  },
  format: 'umd',
  dest: 'dist/videojs.rollup.js'
};

const minifiedUmd = Object.assign({}, _.cloneDeep(umd), {
  dest: 'dist/videojs.rollup.min.js'
});

minifiedUmd.options.plugins.splice(4, 0, uglify());

const novttUmd = Object.assign({}, _.cloneDeep(umd), {
  dest: 'dist/alt/videojs.novtt.rollup.js'
});

novttUmd.options.plugins.unshift(ignore(['videojs-vtt.js/dist/vtt.js']));

const minifiedNovttUmd = Object.assign({}, _.cloneDeep(minifiedUmd), {
  dest: 'dist/alt/videojs.novtt.rollup.min.js'
});

minifiedNovttUmd.options.plugins.unshift(ignore(['videojs-vtt.js/dist/vtt.js']));

function runRollup({options, format, dest}) {
  rollup(options)
  .then(function(bundle) {
    bundle.write({
      format,
      dest,
      moduleName: 'videojs',
      sourceMap: false
    });
  }, function(err) {
    // eslint-disable-next-line no-console
    console.error(err);
  });
}

if (!args.watch) {
  if (args.minify) {
    runRollup(minifiedUmd);
    runRollup(minifiedNovttUmd);
  } else {
    runRollup(es);
    runRollup(cjs);
    runRollup(umd);
    runRollup(novttUmd);
  }
} else {
  const watchers = [
    ['es', watch({rollup},
                 Object.assign({},
                               es.options,
                               _.pick(es, ['format', 'dest'])))],
    ['cjs', watch({rollup},
                  Object.assign({},
                                cjs.options,
                                _.pick(cjs, ['format', 'dest'])))],
    ['umd', watch({rollup},
                  Object.assign({moduleName: 'videojs'},
                                umd.options,
                                _.pick(umd, ['format', 'dest'])))],
    ['novtt', watch({rollup},
                    Object.assign({moduleName: 'videojs'},
                                  novttUmd.options,
                                  _.pick(novttUmd, ['format', 'dest'])))]
  ];

  watchers.forEach(function([type, watcher]) {
    watcher.on('event', (details) => {
      if (details.code === 'BUILD_START') {
        // eslint-disable-next-line no-console
        console.log(`Bundling ${type}...`);
        return;
      }

      if (details.code === 'BUILD_END') {
        // eslint-disable-next-line no-console
        console.log(`Bundled ${type} in %s`, duration(details.duration));
        return;
      }

      if (details.code === 'ERROR') {
        // eslint-disable-next-line no-console
        console.error(details.error.toString());
        return;
      }
    });
  });
}
