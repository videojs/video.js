import path from 'path';
import fs from 'fs';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import progress from 'rollup-plugin-progress';
import ignore from 'rollup-plugin-ignore';
import alias from 'rollup-plugin-alias';
import _ from 'lodash';
import pkg from './package.json';

const compiledLicense = _.template(fs.readFileSync('./build/license-header.txt', 'utf8'));
const bannerData = _.pick(pkg, ['version', 'copyright']);
const banner = compiledLicense(Object.assign({includesVtt: true}, bannerData));

// to prevent going into a screen during rollup
process.stderr.isTTY = false;

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
  compact: false,
  presets: [
    ['@babel/preset-env', {
      loose: true,
      modules: false
    }]
  ]
});
const globals = {
  browser: {
    'global': 'window',
    'global/window': 'window',
    'global/document': 'document'
  },
  module: {
  },
  test: {
    qunit: 'QUnit',
    qunitjs: 'QUnit',
    sinon: 'sinon'
  }
};

const externals = {
  browser: Object.keys(globals.browser).concat([
  ]),
  module: Object.keys(globals.module).concat([
    'global',
    'global/document',
    'global/window',
    'xhr',
    'tsml',
    'safe-json-parse/tuple',
    'videojs-vtt.js'
  ]),
  test: Object.keys(globals.test).concat([
  ])
};

export default cliargs => [
  // standard umd file
  {
    input: 'src/js/index.js',
    output: {
      format: 'umd',
      file: 'dist/video.js',
      name: 'videojs',
      strict: false,
      banner,
      globals: globals.browser
    },
    external: externals.browser,
    plugins: [
      alias({
        'video.js': path.resolve(__dirname, './src/js/video.js')
      }),
      primedResolve,
      json(),
      primedCjs,
      primedBabel,
      cliargs.progress !== false ? progress() : {}
    ]
  },
  // es, cjs
  {
    input: 'src/js/index.js',
    output: [
      {
        format: 'es',
        file: 'dist/video.es.js',
        strict: false,
        banner,
        globals: globals.module
      }, {
        format: 'cjs',
        file: 'dist/video.cjs.js',
        strict: false,
        banner,
        globals: globals.module
      }
    ],
    external: externals.module,
    plugins: [
      alias({
        'video.js': path.resolve(__dirname, './src/js/video.js'),
        '@videojs/http-streaming': path.resolve(__dirname, './node_modules/@videojs/http-streaming/dist/videojs-http-streaming.es.js')
      }),
      primedResolve,
      json(),
      primedCjs,
      primedBabel,
      cliargs.progress !== false ? progress() : {}
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
      globals: globals.browser
    },
    external: externals.browser,
    plugins: [
      primedIgnore,
      alias({
        'video.js': path.resolve(__dirname, './src/js/video.js')
      }),
      primedResolve,
      json(),
      primedCjs,
      primedBabel,
      cliargs.progress !== false ? progress() : {}
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
      globals: globals.module
    },
    external: externals.module,
    plugins: [
      primedResolve,
      json(),
      primedCjs,
      primedBabel,
      cliargs.progress !== false ? progress() : {}
    ]
  },
  // core umd
  {
    input: 'src/js/video.js',
    output: {
      format: 'umd',
      name: 'videojs',
      file: 'dist/alt/video.core.js',
      strict: false,
      banner,
      globals: globals.browser
    },
    external: externals.browser,
    plugins: [
      primedResolve,
      json(),
      primedCjs,
      primedBabel,
      cliargs.progress !== false ? progress() : {}
    ]
  },
  // core novtt umd
  {
    input: 'src/js/video.js',
    output: {
      format: 'umd',
      name: 'videojs',
      file: 'dist/alt/video.core.novtt.js',
      strict: false,
      banner: compiledLicense(Object.assign({includesVtt: true}, bannerData)),
      globals: globals.browser
    },
    external: externals.browser,
    plugins: [
      primedIgnore,
      primedResolve,
      json(),
      primedCjs,
      primedBabel,
      cliargs.progress !== false ? progress() : {}
    ]
  }
];
