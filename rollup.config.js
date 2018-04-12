import path from 'path';
import fs from 'fs';
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
import alias from 'rollup-plugin-alias';
import _ from 'lodash';
import pkg from './package.json';

const compiledLicense = _.template(fs.readFileSync('./build/license-header.txt', 'utf8'));
const bannerData = _.pick(pkg, ['version', 'copyright']);
const banner = compiledLicense(Object.assign({includesVtt: true}, bannerData));

const onwarn = (warning) => {
  if (warning.code === 'UNUSED_EXTERNAL_IMPORT' ||
      warning.code === 'UNRESOLVED_IMPORT') {
    return;
  }

  // eslint-disable-next-line no-console
  console.warn(warning.message);
}

const globals = {
  'global/document': 'document',
  'global/window': 'window'
}

const primedIgnore = ignore(['videojs-vtt.js']);
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
  exclude: 'node_modules/**(!http-streaming)',
  presets: [
    ['es2015', {
      loose: true,
      modules: false
    }]
  ],
  plugins: ['external-helpers']
});

export default [
  // es, cjs
  {
    input: 'src/js/index.js',
    output: [
      {
        format: 'es',
        file: 'dist/video.es.js',
        strict: false,
        banner,
        globals
      }, {
        format: 'cjs',
        file: 'dist/video.cjs.js',
        strict: false,
        banner,
        globals
      }
    ],
    plugins: [
      alias({
        'video.js': path.resolve(__dirname, './src/js/video.js'),
        '@videojs/http-streaming': path.resolve(__dirname, './node_modules/@videojs/http-streaming/dist/videojs-http-streaming.es.js')
      }),
      json(),
      primedBabel,
      progress(),
      filesize()
    ],
    onwarn
  },
  // standard umd file
  {
    input: 'src/js/index.js',
    output: {
      format: 'umd',
      file: 'dist/video.js',
      name: 'videojs',
      strict: false,
      banner,
      globals
    },
    plugins: [
      alias({
        'video.js': path.resolve(__dirname, './src/js/video.js')
      }),
      primedResolve,
      json(),
      primedCjs,
      primedBabel,
      progress(),
      filesize()
    ]
  },
  // novtt umd
  {
    input: 'src/js/index.js',
    output: {
      format: 'umd',
      file: 'dist/alt/video.novtt.js',
      name: 'videojs',
      strict: false,
      banner: compiledLicense(Object.assign({includesVtt: true}, bannerData)),
      globals
    },
    plugins: [
      primedIgnore,
      alias({
        'video.js': path.resolve(__dirname, './src/js/video.js')
      }),
      primedResolve,
      json(),
      primedCjs,
      primedBabel,
      progress(),
      filesize()
    ]
  },
  // core
  {
    input: 'src/js/video.js',
    output: {
      format: 'cjs',
      file: 'core.js',
      strict: false,
      banner,
      globals
    },
    plugins: [
      json(),
      primedBabel,
      progress(),
      filesize()
    ],
    onwarn
  },
  // core umd
  {
    input: 'src/js/video.js',
    output: {
      format: 'cjs',
      file: 'dist/alt/video.core.js',
      strict: false,
      banner,
      globals
    },
    plugins: [
      primedResolve,
      json(),
      primedCjs,
      primedBabel,
      progress(),
      filesize()
    ],
    onwarn
  },
  // core novtt umd
  {
    input: 'src/js/video.js',
    output: {
      format: 'cjs',
      file: 'dist/alt/video.core.novtt.js',
      strict: false,
      banner: compiledLicense(Object.assign({includesVtt: true}, bannerData)),
      globals
    },
    plugins: [
      primedIgnore,
      primedResolve,
      json(),
      primedCjs,
      primedBabel,
      progress(),
      filesize()
    ],
    onwarn
  }
];
