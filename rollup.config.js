import riot from 'rollup-plugin-riot';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
import uglify from 'rollup-plugin-uglify';
import stylusCssModules from 'rollup-plugin-stylus-css-modules';

export default {
  entry: 'src/js/main.js',
  dest: 'assets/javascripts/front.js',
  plugins: [
    riot(),
    nodeResolve({ jsnext: true }),
    commonjs(),
    buble(),
    uglify()
  ]
}
