import riot from 'rollup-plugin-riot'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'

export default {
  entry: 'src/js/main.js'
  dest: 'dist/javascripts/main.js'
  plugins: [
    riot(),
    nodeResolve(),
    commonjs(),
    babel()
  ]
}
