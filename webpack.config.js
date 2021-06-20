/**
 * File: webpack.config.js
 * Description: Used to transform all source files into a production bundle.js file for the index file to reference when deployed
 * Webpack is only able to understand javascript and json files. So in order to reference other types of files to transform to put into the
 * bundle.js you must use "loaders". For example if you want to transform svg files, use a regex test: /\.svg$/ and use: 'svg-inline-loader'  * for example. You must download your loaders via npm
 *
 * For css loading you must use a css loader (maybe "css-loader") and a style loader as well (maybe "style-loader"). 
 * Example: put this in rules arr -> { test: /\.css$/, use: [ 'style-loader', 'css-loader' ]}
 * 
 * Babel is useful it allows you to future proof your javascript. npm install babel-loader and add this rule: 
 * { test: /\.(js)$/, use: 'babel-loader' }
 *
 * Output is the final output of the build.
 * Build -> Identify File Type Rule -> Transform -> Output
 *
 *
 */

// Run: npm run-script serve

// This contains all the exports to build the bundle.js file

//// Extra optimization options: 
// optimization: {
//     minimize: true,
//     removeAvailableModules: true,
//     flagIncludedChunks: true,
//     usedExports: true,
//     concatenateModules: true,
//     sideEffects: false, // <----- in prod defaults to true if left blank
// }

// output: {
//     path: path.resolve(__dirname, 'dist'),
//     publicPath: '/',
//     filename: 'index_bundle.js?t=' + new Date().getTime(), // This will be the created bundle file that webpack creates for react to use in production changed from index_bundle.js to [hash].js
//     clean: true
// },

// {
//     test: /\.css$/i, use: [ 'style-loader', 'css-loader' ]
// },

// Showing unique time at end of index bundle on load dev
// ｣: wait until bundle finished: /917.index_bundle.js?t=1624143218453
// i ｢wdm｣: wait until bundle finished: /src/static/angle-double-left-solid.svg
// i ｢wdm｣: wait until bundle finished: /src/static/friendsWhite.svg

// Remove clean: true from output because:
// When redeploying, on rebuilding the app bundles make sure NOT to clean the output folder with previous chunk files, because users that already have the app loaded will try to fetch previous chunk files that will not exist anymore.

// Sometimes will get chunk load error. Could have been something to do with clean: true option

// Best thing to do is to have an app version tracking (using AJAX and read from db or dynamic config file) and when the app detects a newer version, message the user about it and ask them to reload the page.

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const regeneratorRuntime = require("regenerator-runtime");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: "./src/index.js", // The entry point for the application
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/', 
        filename: '[name].[contenthash].js', // This will be the created bundle file that webpack creates for react to use in production changed from index_bundle.js to [hash].js
        chunkFilename: '[id].[contenthash].js'
    },
    module: {
        rules: [
            { 
                test: /\.jsx?$/, 
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [['@babel/preset-react', { "runtime": "classic" }]]
                    }
                }
            },
            {
                test: /\.css$/i, use: [ 'style-loader', 'css-loader' ]
            },
            {
                test: /\.(png|jpe?g|gif|svg|woff|woff2|eot|ttf|otf)$/i, 
                loader: 'file-loader',
                options: { 
                    name: '[path][name].[ext]' 
                }
            }
        ]
    },
    target: ['web', 'es5'],
    devServer: {
        port: 3000,
        historyApiFallback: {
            index: '/'
        }
    },
    plugins: [
        new HtmlWebpackPlugin({ 
            template: "./public/index.html"
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser'
        })        
    ],
    mode: 'production' // Can be set to development or production. Webpack will minify code and strip warnings
}