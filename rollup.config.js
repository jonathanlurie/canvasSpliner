var config = require('./package.json');

import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: config.main,
  format: config.moduleFormat,
  moduleName: config.moduleName,
  sourceMap: true,
  dest: config.moduleBuildDir + '/' + config.name + '.js',
  plugins: [
    nodeResolve(),
    commonjs()
  ]
};
