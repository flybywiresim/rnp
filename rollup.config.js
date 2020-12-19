'use strict';

const fs = require('fs');
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const virtual = require('@rollup/plugin-virtual');
const { name, version } = require('./package.json');

const banner = `/*!
 * ${name} ${version}
 *
 * ${fs.readFileSync('./LICENSE', 'utf8').trim().split('\n').join('\n * ')}
 */
`;

module.exports = () => ({
  input: './src/index.js',
  plugins: [
    virtual({
      fs: '',
      util: '',
      repl: '',
      path: '',
    }),
    commonjs(),
    nodeResolve(),
    replace({
      'require.main === module': 'false',
    }, {
      include: './src/index.js',
    }),
  ],
  output: [{
    file: './site/rnp.mjs',
    format: 'es',
    sourcemap: true,
    banner,
  }],
});
