import path from 'path';
import fs from 'fs';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import progressPlugin from 'rollup-plugin-progress';
import ignore from 'rollup-plugin-ignore';
import alias from 'rollup-plugin-alias';
import _ from 'lodash';
import pkg from './package.json';
import multiEntry from 'rollup-plugin-multi-entry';
import stub from 'rollup-plugin-stub';
import isCI from 'is-ci';
import replace from '@rollup/plugin-replace';
import image from '@rollup/plugin-image';
import istanbul from 'rollup-plugin-istanbul';
import externalGlobals from 'rollup-plugin-external-globals';
import svg from 'rollup-plugin-svg';
import excludeLines from './build/rollup-exclude-lines';

const excludeCoverage = [
  'test/**',
  'node_modules/**',
  'package.json',
  /^data-files!/
];

const CI_TEST_TYPE = process.env.CI_TEST_TYPE || '';
const compiledLicense = _.template(fs.readFileSync('./build/license-header.txt', 'utf8'));
const bannerData = _.pick(pkg, ['version', 'copyright']);
const banner = compiledLicense(Object.assign({includesVtt: true}, bannerData));

const watch = {
  clearScreen: false
};

const onwarn = (warning) => {
  // ignore unknown option for --no-progress
  if (warning.code === 'UNKNOWN_OPTION' && warning.message.indexOf('progress') !== -1) {
    return;
  }

  // eslint-disable-next-line no-console
  console.warn(warning.message);
};

const primedIgnore = ignore(['videojs-vtt.js']);
const primedResolve = resolve({
  mainFields: ['jsnext:main', 'module', 'main'],
  browser: true
});
const primedCjs = commonjs({
  sourceMap: false
});
const primedBabel = babel({
  runtimeHelpers: true,
  babelrc: false,
  exclude: 'node_modules/**(!http-streaming)',
  compact: false,
  presets: [
    ['@babel/preset-env', {
      targets: [
        'last 3 major versions',
        'Firefox ESR',
        // This ensures support for certain smart TVs (ex. LG WebOS 4)
        'Chrome >= 53',
        'not dead',
        'not ie 11',
        'not baidu 7',
        'not and_qq 11',
        'not and_uc 12',
        'not op_mini all'
      ],
      bugfixes: true,
      loose: true,
      modules: false
    }]
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', {regenerator: false}]
  ]
});
const primedExternalGlobals = externalGlobals({
  'global': 'window',
  'global/window': 'window',
  'global/document': 'document'
});

const progress = () => {
  if (isCI) {
    return {};
  }

  return progressPlugin();
};

const globals = {
  browser: {
  },
  module: {
  },
  test: {
    qunit: 'QUnit',
    qunitjs: 'QUnit',
    sinon: 'sinon'
  }
};

const moduleExternals = [
  'global',
  '@videojs/xhr',
  'safe-json-parse',
  'videojs-vtt.js',
  'url-toolkit',
  'm3u8-parser',
  'mpd-parser',
  'mux.js',
  'aes-decrypter',
  'keycode',
  '@babel/runtime'
];
const externals = {
  browser: [],
  module(id) {
    const result = moduleExternals.some((ext) => id.indexOf(ext) !== -1);

    return result;
  },
  test: Object.keys(globals.test).concat([
  ])
};

export default cliargs => [
  // standard umd file
  {
    input: 'src/js/index.js',
    output: {
      format: 'umd',
      amd: {
        id: 'videojs'
      },
      file: 'dist/video.js',
      name: 'videojs',
      banner,
      globals: globals.browser
    },
    external: externals.browser,
    plugins: [
      excludeLines({
        include: 'src/js/**'
      }),
      alias({
        'video.js': path.resolve(__dirname, './src/js/video.js')
      }),
      primedResolve,
      json(),
      primedExternalGlobals,
      primedCjs,
      primedBabel,
      svg(),
      cliargs.progress !== false ? progress() : {}
    ],
    onwarn,
    watch
  },
  // debug umd file
  {
    input: 'src/js/debug.js',
    output: {
      format: 'umd',
      file: 'dist/alt/video.debug.js',
      name: 'videojs',
      banner,
      globals: globals.browser
    },
    external: externals.browser,
    plugins: [
      excludeLines({
        include: 'src/js/**'
      }),
      alias({
        'video.js': path.resolve(__dirname, './src/js/video.js')
      }),
      primedResolve,
      json(),
      primedExternalGlobals,
      primedCjs,
      primedBabel,
      svg(),
      cliargs.progress !== false ? progress() : {}
    ],
    onwarn,
    watch
  },
  {
    input: 'test/unit/**/*.test.js',
    output: {
      format: 'iife',
      name: 'videojsTests',
      file: 'test/dist/bundle.js',
      globals: globals.test
    },
    external: externals.test,
    plugins: [
      excludeLines({
        include: 'src/js/**'
      }),
      multiEntry({exports: false}),
      alias({
        'video.js': path.resolve(__dirname, './src/js/video.js')
      }),
      primedResolve,
      json(),
      stub(),
      primedCjs,
      CI_TEST_TYPE === 'coverage' ? istanbul({exclude: excludeCoverage}) : {},
      primedBabel,
      image(),
      cliargs.progress !== false ? progress() : {}

    ],
    onwarn,
    watch
  },
  // es, cjs
  {
    input: 'src/js/index.js',
    output: [
      {
        format: 'es',
        file: 'dist/video.es.js',
        banner,
        globals: globals.module
      }, {
        format: 'cjs',
        file: 'dist/video.cjs.js',
        banner,
        globals: globals.module
      }
    ],
    external: externals.module,
    plugins: [
      excludeLines({
        include: 'src/js/**'
      }),
      alias({
        'video.js': path.resolve(__dirname, './src/js/video.js'),
        'videojs-contrib-quality-levels': path.resolve(__dirname, './node_modules/videojs-contrib-quality-levels/dist/videojs-contrib-quality-levels.es.js'),
        '@videojs/http-streaming': path.resolve(__dirname, './node_modules/@videojs/http-streaming/dist/videojs-http-streaming.es.js')
      }),
      replace({
        // single quote replace
        "require('@videojs/vhs-utils/es": "require('@videojs/vhs-utils/cjs",
        // double quote replace
        'require("@videojs/vhs-utils/es': 'require("@videojs/vhs-utils/cjs'
      }),
      json(),
      primedBabel,
      svg(),
      cliargs.progress !== false ? progress() : {}
    ],
    onwarn,
    watch
  },
  // novtt umd
  {
    input: 'src/js/index.js',
    output: {
      format: 'umd',
      file: 'dist/alt/video.novtt.js',
      name: 'videojs',
      banner: compiledLicense(Object.assign({includesVtt: true}, bannerData)),
      globals: globals.browser
    },
    external: externals.browser,
    plugins: [
      primedIgnore,
      excludeLines({
        include: 'src/js/**'
      }),
      alias({
        'video.js': path.resolve(__dirname, './src/js/video.js')
      }),
      primedResolve,
      json(),
      primedExternalGlobals,
      primedCjs,
      primedBabel,
      svg(),
      cliargs.progress !== false ? progress() : {}
    ],
    onwarn,
    watch
  },
  // core cjs, es
  {
    input: 'src/js/video.js',
    output: [
      {
        format: 'es',
        file: 'core.es.js',
        banner,
        globals: globals.module
      }, {
        format: 'cjs',
        file: 'core.js',
        banner,
        globals: globals.module
      }
    ],
    external: externals.module,
    plugins: [
      excludeLines({
        include: 'src/js/**'
      }),
      json(),
      primedBabel,
      svg(),
      cliargs.progress !== false ? progress() : {}
    ],
    onwarn,
    watch
  },
  // core umd
  {
    input: 'src/js/video.js',
    output: {
      format: 'umd',
      name: 'videojs',
      file: 'dist/alt/video.core.js',
      banner,
      globals: globals.browser
    },
    external: externals.browser,
    plugins: [
      primedResolve,
      excludeLines({
        include: 'src/js/**'
      }),
      json(),
      primedExternalGlobals,
      primedCjs,
      primedBabel,
      svg(),
      cliargs.progress !== false ? progress() : {}
    ],
    onwarn,
    watch
  },
  // core novtt umd
  {
    input: 'src/js/video.js',
    output: {
      format: 'umd',
      name: 'videojs',
      file: 'dist/alt/video.core.novtt.js',
      banner: compiledLicense(Object.assign({includesVtt: true}, bannerData)),
      globals: globals.browser
    },
    external: externals.browser,
    plugins: [
      primedIgnore,
      primedResolve,
      excludeLines({
        include: 'src/js/**'
      }),
      json(),
      primedExternalGlobals,
      primedCjs,
      primedBabel,
      svg(),
      cliargs.progress !== false ? progress() : {}
    ],
    onwarn,
    watch
  }
];
