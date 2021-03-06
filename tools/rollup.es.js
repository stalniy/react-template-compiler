import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  external: ['he', 'de-indent'],
  output: {
    file: 'dist/index.es.js',
    format: 'es'
  },
  plugins: [
    babel({
      plugins: ['external-helpers']
    })
  ]
};
