// rollup.config.js
import typescript from 'rollup-plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'

export default {
  output: {
    file: 'dist/bundle.js',
  },
  input: 'src/index.ts',
  plugins: [typescript({ lib: ['es5', 'es6', 'dom'], target: 'es5' }), resolve()],
  external: [
    'color',
    'prosemirror-utils',
    'prosemirror-tables',
    'prosemirror-view',
    'prosemirror-transform',
    'prosemirror-state',
    'prosemirror-model',
  ],
}
