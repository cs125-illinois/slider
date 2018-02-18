const webpack = require('webpack')
const path = require('path')

const ExtractTextPlugin = require('extract-text-webpack-plugin')
const WebpackCleanupPlugin = require('webpack-cleanup-plugin')

module.exports = {
  output: {
    publicPath: '/',
    path: __dirname + '/dist/',
    filename: '[name].[chunkhash].js'
  },
  entry: {
    slides: [
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
    new WebpackCleanupPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.(scss)$/,
        use: ExtractTextPlugin.extract({
          use: [
            { loader: 'css-loader',
              options: {
                minimize: true
              }
            },
            { loader: 'sass-loader' },
          ]
        })
      },
      {
        test: /\.(css)$/,
        use: ExtractTextPlugin.extract({
          use: [
            { loader: 'css-loader',
              options: {
                minimize: true
              }
            }
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
