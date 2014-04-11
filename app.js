'use strict';

// cc-crawler.js
// -------------
// Prints out the latest reward URLs of the specified type.

var url = require('url');
var querystring = require('querystring');
var http = require('http');

var server = http.createServer(function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
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
      res.end(render(parse(r)));
    });
  });
});
server.listen(3000);

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

function render(r) {
  var s = '';
  s += '<table style="width: 100%; table-layout: fixed"><thead><tr><th>Chips</th><th>OJs</th><th>Coins</th></tr></thead><tbody><tr valign="top">';
  s += '<td>';
  s += r.chips.map(function(uri) { return '<a href="' + uri.s + '">' + uri.parsed.query.reward_key + '</a><br>'; }).join('');
  s += '</td><td>';
  s += r.ojs.map(function(uri) { return '<a href="' + uri.s + '">' + uri.parsed.query.reward_key + '</a><br>'; }).join('');
  s += '</td><td>';
  s += r.coins.map(function(uri) { return '<a href="' + uri.s + '">' + uri.parsed.query.reward_key + '</a><br>'; }).join('');
  s += '</td></table>';
  // s += '<pre>' + JSON.stringify(r, null, '  ') + '</pre>';
  return s;
}
