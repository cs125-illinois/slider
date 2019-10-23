require('dotenv').config()
const webpack = require('webpack')
const path = require('path')

const ExtractTextPlugin = require('extract-text-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const WebpackCleanupPlugin = require('webpack-cleanup-plugin')
const Dotenv = require('dotenv-webpack')

module.exports = function (env, argv) {
  let config = {
    output: {
      publicPath: '/',
      path: __dirname + '/dist/',
      filename: '[name].[chunkhash].js'
    },
    entry: {
      slider: [
        './client/slider.js'
      ],
    },
    node: {
      fs: 'empty'
    },
    plugins: [
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery',
        Popper: ['popper.js', 'default']
      }),
      new ExtractTextPlugin('[name].[chunkhash].css'),
      new UglifyJSPlugin({
        cache: true
      }),
      new WebpackCleanupPlugin(),
      new Dotenv()
    ],
    module: {
      rules: [
        {
          test: /\.(scss)$/,
          use: ExtractTextPlugin.extract({
            use: [
              { loader: 'css-loader' },
              { loader: 'sass-loader' },
            ]
          })
        },
        {
          test: /\.(css)$/,
          use: ExtractTextPlugin.extract({
            use: [
              { loader: 'css-loader' }
            ]
          })
        },
        {
          test: /\.(eot|svg|ttf|woff|woff2)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                outputPath: 'fonts/'
              }
            }
          ]
        },
        {
          test: require.resolve('jquery'),
          use: [{
            loader: 'expose-loader',
            options: '$'
          }]
        }
      ]
    }
  }
  if (!(process.env.ENV === 'production')) {
    config.plugins = config.plugins.filter((plugin) => plugin.constructor.name !== 'UglifyJsPlugin')
  }
  return config
}
