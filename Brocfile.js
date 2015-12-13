const funnel = require('broccoli-funnel');
const browserify = require('broccoli-browserify');
const babel = require('broccoli-babel-transpiler');

const mergeTrees = require('broccoli-merge-trees');
const jadeBuilder = require('broccoli-jade');
const stylusBuilder = require('broccoli-stylus-single');
const pickFiles = require('broccoli-static-compiler');
const src = 'src/js';
const stylus = 'src/stylus';
const pkg = require('./package.json');

const fs = require('fs');

// TODO: なんかタスクめいたものを作る
fs.readFile('./src/templates/side.ikr', 'utf-8', function(err, data){
  var tgt = "export default '" + data.replace(/([\n\r]+[\s]+|[\n\r]+)/g, "") + "'";
  fs.writeFile('./src/js/templates/side.js', tgt);
});
fs.readFile('./src/templates/list.ikr', 'utf-8', function(err, data){
  var tgt = "export default '" + data.replace(/([\n\r]+[\s]+|[\n\r]+)/g, "") + "'";
  fs.writeFile('./src/js/templates/list.js', tgt);
});
fs.readFile('./src/templates/paginator.ikr', 'utf-8', function(err, data){
  var tgt = "export default '" + data.replace(/([\n\r]+[\s]+|[\n\r]+)/g, "") + "'";
  fs.writeFile('./src/js/templates/paginator.js', tgt);
});
fs.readFile('./src/templates/entry.ikr', 'utf-8', function(err, data){
  var tgt = "export default '" + data.replace(/([\n\r]+[\s]+|[\n\r]+)/g, "") + "'";
  fs.writeFile('./src/js/templates/entry.js', tgt);
});



var js = babel(src, {experimental:true});

js = browserify(js, {
  entries: ['./front.js'],
  outputFile: 'assets/javascripts/front.js'
});
var jade = "src/jade";
var html = funnel(jade, {
  srcDir: "/",
  destDir: ''
});

html = jadeBuilder(html);

var css = funnel(stylus, {
  srcDir: '/',
  destDir: ''
})
css = stylusBuilder(css, 'main.styl', 'assets/stylesheets/main.css');

var imagesTree = pickFiles('src/statics',{
  srcDir: '/assets',
  // files: ['**/*.svg'],
  destDir: 'assets'
});

module.exports = mergeTrees([js, html, css, imagesTree]);
