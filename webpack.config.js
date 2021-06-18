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

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const regeneratorRuntime = require("regenerator-runtime");


module.exports = {
    entry: "./src/index.js", // The entry point for the application
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        filename: 'index_bundle.js' // This will be the created bundle file that webpack creates for react to use in production
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
    mode: 'production', // Can be set to development or production. Webpack will minify code and strip warnings
    optimization: {
        minimize: true,
        namedModules: true,
        namedChunks: true,
        removeAvailableModules: true,
        flagIncludedChunks: true,
        usedExports: true,
        concatenateModules: true,
        sideEffects: false, // <----- in prod defaults to true if left blank
    }
}