import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';

export default [
  {
    input: 'src/js/video.js',
    output: {
      file: 'src/js/bundle.js',
      format: 'es'
    },
    onwarn(warning) {
      if (warning.code === 'UNUSED_EXTERNAL_IMPORT' ||
          warning.code === 'UNRESOLVED_IMPORT') {
          return;
        }

      // eslint-disable-next-line no-console
      console.warn(warning.message || warning);
    },
    plugins: [
      json(),
      babel({
        babelrc: false,
        exclude: 'node_modules/**',
        presets: [['es2015', { loose: true, modules: false }]],
        plugins: ['external-helpers']
      })
    ]
  }
];
