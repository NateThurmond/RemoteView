// webpack.config.js
const path = require('path');
const Dotenv = require('dotenv-webpack');
const yargs = require('yargs');
const ESLintPlugin = require('eslint-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const env = yargs.argv.env; // e.g. `--env build` or `--env dev`
const libraryName = 'remoteView';
const isProduction = env === 'build';

module.exports = {
  // Define "mode" so you don't get warnings:
  mode: isProduction ? 'production' : 'development',

  entry: path.resolve(__dirname, 'src/index.js'),

  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: isProduction
      ? `${libraryName}.min.js`
      : `${libraryName}.js`,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },

  // For source maps:
  devtool: 'source-map',

  module: {
    rules: [
      // Transpile JS with Babel
      {
        test: /\.(js|jsx)$/,
        use: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },

  // ESLint is now a plugin rather than a loader
  plugins: [
    new Dotenv(),
    new ESLintPlugin({
      extensions: ['js', 'jsx'],
    })
  ],

  // Use Terser for minification in production
  optimization: {
    minimize: isProduction,
    minimizer: [new TerserPlugin()]
  },

  resolve: {
    extensions: ['.js', '.json'],
    modules: [
      path.resolve('./node_modules'),
      path.resolve('./src')
    ]
  }
};

