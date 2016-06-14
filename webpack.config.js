var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var gulp = require('gulp');
var clean = require('gulp-clean');
var copy = require('gulp-copy');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

// 静态服务器
var express = require('express');
var app = express();
app.use(express.static('./dist/'));
app.listen(4567, function(){
    console.log('http://localhost:4567');
});

// 清空dist目录
// 拷贝images
gulp.task('clean-dist', function() {
    return gulp.src('./dist/', {
            read: false
        })
        .pipe(clean());
});
gulp.task('copy-resource', ['clean-dist'], function() {
    return gulp.src([
                './src/images/*.*',
                './src/css/*.*'
            ], {
                base: './src/'
            })
        .pipe(gulp.dest('./dist/'));
});
gulp.start('copy-resource');

// 
module.exports = {
    // 插件
    plugins: [
        // 压缩
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
            },
            output: {
                comments: false,
            },
        }),
        // 首页
        new HtmlWebpackPlugin({
          filename: 'index.html',
          template: './src/page/index/index.html',
          chunks: ['index']
        }),
        // 
        new HtmlWebpackPlugin({
          filename: 'address.html',
          template: './src/page/address/index.html',
          chunks: ['address']
        })
    ],
    // 入口文件
    entry: {
        'index': 'page/index',
        'address': 'page/address',
        //'widget/widget': 'widget/widget.js'
    },
    // 输出文件
    output: {
        path: __dirname + '/dist/',
        filename: '[name].[chunkhash].js',
        libraryTarget: 'umd'
    },
    module: {
        //加载器配置
        loaders: [
            //.css 文件使用 style-loader 和 css-loader 来处理
            { 
                test: /\.css$/, 
                loader: 'style-loader!css-loader'
            },
            { 
                test: /\.json$/, 
                loader: 'json-loader'
            },
            //
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                loaders: [
                    'file?hash=sha512&digest=hex&name=[hash].[ext]',
                    'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
                ]
            }
        ]
    },
    resolve: {
        // 别名
        alias: {
            page: './src/page',
            css: './src/css',
            widget: './src/widget/'
        }
    }
};