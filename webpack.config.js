const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
require('dotenv').config();

module.exports = (_, argv) => {
  const production = argv.mode === 'production';

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'assets/[name].[contenthash:8].js',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({ template: './src/index.html' }),
      new MiniCssExtractPlugin({ filename: 'assets/[name].[contenthash:8].css' }),
      new webpack.DefinePlugin({
        'process.env.GOOGLE_BOOKS_API_KEY': JSON.stringify(process.env.GOOGLE_BOOKS_API_KEY || ''),
      }),
    ],
    optimization: { minimize: production },
    devtool: production ? false : 'source-map',
    devServer: { port: 3000, hot: true },
  };
};
