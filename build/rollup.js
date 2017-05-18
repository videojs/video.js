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
import pkg from '../package.json';
import fs from 'fs';

const args = minimist(process.argv.slice(2), {
  boolean: ['watch', 'minify', 'progress'],
  default: {
    progress: true
  },
  alias: {
    w: 'watch',
    m: 'minify',
    p: 'progress'
  }
});

const compiledLicense = _.template(fs.readFileSync('./build/license-header.txt', 'utf8'));
const bannerData = _.pick(pkg, ['version', 'copyright']);

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
  exclude: 'node_modules/**',
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
      args.progress ? progress() : {},
      filesize()
    ],
    onwarn(warning) {
      if (warning.code === 'UNUSED_EXTERNAL_IMPORT' ||
          warning.code === 'UNRESOLVED_IMPORT') {
        return;
      }

      // eslint-disable-next-line no-console
      console.warn(warning.message);
    },
    legacy: true
  },
  banner: compiledLicense(Object.assign({includesVtt: true}, bannerData)),
  format: 'es',
  dest: 'dist/video.es.js'
};

const cjs = Object.assign({}, es, {
  format: 'cjs',
  dest: 'dist/video.cjs.js'
});

const umd = {
  options: {
    entry: 'src/js/video.js',
    plugins: [
      primedResolve,
      json(),
      primedCjs,
      primedBabel,
      args.progress ? progress() : {},
      filesize()
    ],
    legacy: true
  },
  banner: compiledLicense(Object.assign({includesVtt: true}, bannerData)),
  format: 'umd',
  dest: 'dist/video.js'
};

const minifiedUmd = Object.assign({}, _.cloneDeep(umd), {
  dest: 'dist/video.min.js'
});

minifiedUmd.options.plugins.splice(4, 0, uglify({
  preserveComments: 'some',
  screwIE8: false,
  mangle: true,
  compress: {
    /* eslint-disable camelcase */
    sequences: true,
    dead_code: true,
    conditionals: true,
    booleans: true,
    unused: true,
    if_return: true,
    join_vars: true,
    drop_console: true
    /* eslint-enable camelcase */
  }
}));

const novttUmd = Object.assign({}, _.cloneDeep(umd), {
  banner: compiledLicense(Object.assign({includesVtt: false}, bannerData)),
  dest: 'dist/alt/video.novtt.js'
});

novttUmd.options.plugins.unshift(ignore(['videojs-vtt.js']));

const minifiedNovttUmd = Object.assign({}, _.cloneDeep(minifiedUmd), {
  banner: compiledLicense(Object.assign({includesVtt: false}, bannerData)),
  dest: 'dist/alt/video.novtt.min.js'
});

minifiedNovttUmd.options.plugins.unshift(ignore(['videojs-vtt.js']));

function runRollup({options, format, dest, banner}) {
  rollup(options)
  .then(function(bundle) {
    bundle.write({
      format,
      dest,
      banner,
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
  const props = ['format', 'dest', 'banner'];
  const watchers = [
    ['es', watch({rollup},
                 Object.assign({},
                               es.options,
                               _.pick(es, props)))],
    ['cjs', watch({rollup},
                  Object.assign({},
                                cjs.options,
                                _.pick(cjs, props)))],
    ['umd', watch({rollup},
                  Object.assign({moduleName: 'videojs'},
                                umd.options,
                                _.pick(umd, props)))],
    ['novtt', watch({rollup},
                    Object.assign({moduleName: 'videojs'},
                                  novttUmd.options,
                                  _.pick(novttUmd, props)))]
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
