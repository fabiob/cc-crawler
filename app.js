'use strict';

// cc-crawler.js
// -------------
// Prints out the latest reward URLs of the specified type.
// TODO: automatically detect the last posts, instead of having to supply a photo_id.

var url = require('url');
var querystring = require('querystring');
var http = require('http');

var server = http.createServer(function(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  fetch_fql('select id, text, time from comment where object_id = ' + photo_id + ' order by time desc', res);
  res.end();
});
server.listen(3000);

var photo_id = process.argv[2];
var reward_type = process.argv[3];

if (!photo_id || !reward_type)
  usage();
else
  fetch_fql('select id, text, time from comment where object_id = ' + photo_id + ' order by time desc');

function usage() {
  console.log('Usage: node cc-crawler.js photo_id reward_type');
  console.log('Where:');
  console.log('  photo_id is the ID of the photo to crawl');
  console.log('  reward_type is one of:');
  console.log('    0 for Orange Juice');
  console.log('    1 for Potato Chips');
  console.log('    4 for Coins');
}

function fetch_fql(fql, out) {
  http.get({ host: 'graph.facebook.com', path: '/fql?' + querystring.stringify({q: fql}) }, function(res) {
    res.setEncoding('utf8');
    var data = '';
    res.on('data', function(chunk) { data += chunk; });
    res.on('end', function() {
      if (res.statusCode === 200)
        render(parse(data));
      else
        out.write('ERROR: ' + data);
    })
  });
}

function parse(data) {
  var json = JSON.parse(data);
  var r = {};
  json.data.forEach(function(comment) {
    var m;
    if (m = /http\S+/.exec(comment.text)) {
      m.forEach(function(uri) {
        var parsed = url.parse(uri, true);
        
        // reward_type => 0: oj, 1: chips, 4: coins
        var slot = null;
        switch (parsed.query.reward_type) {
          when 0: slot = 'ojs'; break;
          when 1: slot = 'chips'; break;
          when 4: slot = 'coins'; break;
        }
        if (slot)
          (r[slot] = r[slot] || []).push(uri);
      });
    }
  });
}

function render(r, out) {
  out.write('<table><thead><tr><th>Chips</th><th>OJs</th><th>Coins</th></tr></thead><tbody><tr>');
  out.write('<td>');
  r.chips.forEach(function(uri) { out.write('<a href="' + uri + '">' + uri + '</a><br>'); });
  out.write('</td><td>');
  r.ojs.forEach(function(uri) { out.write('<a href="' + uri + '">' + uri + '</a><br>'); });
  out.write('</td><td>');
  r.coins.forEach(function(uri) { out.write('<a href="' + uri + '">' + uri + '</a><br>'); });
  out.write('</td></table>');
}
