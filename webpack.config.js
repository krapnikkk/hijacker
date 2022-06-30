const path = require('path');
const process = require('process');
const webpack = require("webpack")

module.exports = {
    entry: './background.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'background.bundle.js'
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.BABEL_TYPES_8_BREAKING': JSON.stringify(process.env.BABEL_TYPES_8_BREAKING),
            'process.platform': JSON.stringify(process.platform),
            'process.env.TERM': JSON.stringify(process.env.TERM),
            'process.env.BABEL_ENV': JSON.stringify(process.env.BABEL_ENV)
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        })
    ],
    externals: ["fs"],
    resolve: {
        extensions: ['.js'],
        fallback: {
            "stream": require.resolve("stream-browserify"),
            "path": require.resolve("path-browserify"),
            "buffer": require.resolve("buffer"),
            "assert": require.resolve("assert")
        }
    }
};