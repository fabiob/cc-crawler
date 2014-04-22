(function($) {
  'use strict';
  
  var photo_ids = null;
  
  function mainLoop() {
    fetchPhotos(function(photos) {
      fetchMessages(photos, function(messages) {
        parseList(messages, function(data) {
          updateUI(data, function() {
            setTimeout(mainLoop, 1500);
          });
        });
      });
    });
  }
  
  $(function() { mainLoop() });
  
  function fetchPhotos(cb) {
    if (photo_ids)
      return cb(photo_ids);
    fetch_fql('select object_id from photo where owner = 129079313911235 order by created desc limit 10', function(r) {
      return cb(photo_ids = r.data.map(function(d) { return d.object_id; }));
    });
  }
  
  function fetchMessages(photos, cb) {
    fetch_fql('select id, text, time from comment where object_id in (' + photos.join(',') + ') order by time desc', function(r) {
      return cb(r);
    });
  }
  
  function parseList(messages, cb) {
    var r = { chips: [], ojs: [], coins: [] };
    $.each(messages.data, function(_, comment) {
      var rx = /http\S+reward_key=([^&]+)\S+reward_type=([014])\S*/g;
      var m, max = 10;
      while (--max > 0 && (m = rx.exec(comment.text)) !== null) {
        // reward_type => 0: oj, 1: chips, 4: coins
        var uri = m[0], reward_key = m[1], reward_type = Number(m[2]),
            slot = null;
        switch (reward_type) {
          case 0: slot = 'ojs'; break;
          case 1: slot = 'chips'; break;
          case 4: slot = 'coins'; break;
        }
        if (slot && !r[slot].some(function(el) { return el.uri === uri; }))
          r[slot].push({ uri: uri, reward_key: reward_key });
      }
    });
    return cb(r);
  }
  
  function updateUI(data, cb) {
    $.each(data, function(section, items) {
      items.reverse();
      var ul = $('#' + section).find('ul');
      var firstRun = $('li', ul).length === 0;
      $.each(items, function(_, r) {
        if ($("a:contains('" + r.reward_key + "')").length === 0) {
          var li = $('<li>', { 'class': 'list-group-item' }).append(
            $('<a>', { href: r.uri, text: r.reward_key })
          ).prependTo(ul);
          if (!firstRun)
            li.addClass('list-group-item-success').removeClass('list-group-item-success', 10000);
        }
      });
    });
    return cb();
  }

  function fetch_fql(fql, cb) {
    $.getJSON('//graph.facebook.com/fql?q=' + encodeURI(fql), cb);
  }
})(jQuery);
