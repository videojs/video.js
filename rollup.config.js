import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import cjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import filesize from 'rollup-plugin-filesize';
import progress from 'rollup-plugin-progress';
import ignore from 'rollup-plugin-ignore';
import uglify from 'rollup-plugin-uglify';

const minify = process.env.minify || false;
const novtt = process.env.novtt || false;

// targets[minify][novtt]
const targets = {
  false: {
    false: [
      { dest: 'dist/video.rollup.js', format: 'umd' },
      { dest: 'dist/video.rollup.cjs.js', format: 'cjs' },
      { dest: 'dist/video.rollup.es.js', format: 'es' },
    ],
    true: [
      { dest: 'dist/alt/video.novtt.rollup.js', format: 'umd' },
      { dest: 'dist/alt/video.novtt.rollup.cjs.js', format: 'cjs' },
      { dest: 'dist/alt/video.novtt.rollup.es.js', format: 'es' },
    ]
  },
  true: {
    false: [
      { dest: 'dist/video.rollup.min.js', format: 'umd' }
    ],
    true: [
      { dest: 'dist/alt/video.novtt.rollup.min.js', format: 'umd' }
    ]
  }
};

export default {
  entry: 'src/js/video.js',
  format: 'umd',
  moduleName: 'videojs',
  plugins: [
    novtt ? ignore(['videojs-vtt.js/dist/vtt.js']) : {},
    resolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    json(),
    cjs({
      sourceMap: false
    }),
    babel({
      exclude: 'node_modules/**'
    }),
    minify ? uglify() : {},
    progress(),
    filesize()
  ],
  targets: targets[minify][novtt]
};

