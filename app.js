'use strict';

// cc-crawler.js
// -------------
// Prints out the latest reward URLs of the specified type.

var url = require('url');
var querystring = require('querystring');
var http = require('http');

var express = require('express')
var stylus = require('stylus')
var nib = require('nib')

var app = express()
function compile(str, path) {
  return stylus(str).set('filename', path).use(nib());
}
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(stylus.middleware({ src: __dirname + '/public', compile: compile }));
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  fetch_fql('select object_id from photo where owner = 129079313911235 order by created desc limit 3', function(err, r) {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      return res.end(err.message);
    }
    
    var photo_ids = r.data.map(function(d) { return d.object_id; }).join(', ');
    
    fetch_fql('select id, text, time from comment where object_id in (' + photo_ids + ') order by time desc', function(err, r) {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        return res.end(err.message);
      }
      // res.writeHead(200, { 'Content-Type': 'text/html' });
      res.render('index', { r: parse(r) });
    });
  });
});
app.listen(3000)

function fetch_fql(fql, callback) {
  http.get({ host: 'graph.facebook.com', path: '/fql?' + querystring.stringify({q: fql}) }, function(res) {
    res.setEncoding('utf8');
    var data = '';
    res.on('error', function(e) { callback(e); });
    res.on('data', function(chunk) { data += chunk; });
    res.on('end', function() {
      if (res.statusCode === 200)
        callback(null, JSON.parse(data));
      else
        callback(new Error(data));
    })
  });
}

function parse(json) {
  var r = { chips: [], ojs: [], coins: [], json: json };
  json.data.forEach(function(comment) {
    var m;
    if (m = /http\S+/.exec(comment.text)) {
      m.forEach(function(uri) {
        var parsed = url.parse(uri, true);
        
        // reward_type => 0: oj, 1: chips, 4: coins
        var slot = null;
        switch (Number(parsed.query.reward_type)) {
          case 0: slot = 'ojs'; break;
          case 1: slot = 'chips'; break;
          case 4: slot = 'coins'; break;
        }
        if (slot)
          r[slot].push({s: uri, parsed: parsed});
      });
    }
  });
  return r;
}
