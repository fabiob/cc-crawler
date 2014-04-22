'use strict';

// cc-crawler.js
// -------------
// Prints out the latest reward URLs of the specified type.

var express = require('express');
var stylus = require('stylus');
var nib = require('nib');

var app = express();
function compile(str, path) {
  return stylus(str).set('filename', path).use(nib());
}
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(stylus.middleware({ src: __dirname + '/public', compile: compile }));
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.render('index');
});
app.listen(process.env.PORT || 3000, process.env.IP || '0.0.0.0');
