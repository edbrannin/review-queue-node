var Promise = require("bluebird");
var express = require('express');
var router = express.Router();

var model = require('../model.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Bridget' });
});

router.get('/queue.json', function(req, res, next) {
  console.log(req.query);
  var q = model.ItemVersion.query()
    .limit(18)
    .orderBy('size_compressed_bytes', 'desc')
    .groupBy('item_id')
    //.having('')
    .eager('[item, tags, links]');
    //
  //TODO Filter by tags
  var exclude_tags = ['Keep', 'Delete', 'Backlog'];
  if (req.query.tag) {
    if (! Array.isArray(req.query.tag)) {
      req.query.tag = [req.query.tag];
    }

    q = req.query.tag.reduce(function(qq, tag) {
      console.log("Limiting query to include tagged", tag);
      return qq.whereIn('item_id', model.itemIdsTagged(tag));
    }, q);
  }
  q = q.whereNotIn('item_id', model.itemIdsTagged(exclude_tags));

  q.then(function(items) {
    items = items.map(function(item) {
      item.tags = item.tags.map(function(tag) { return tag.name; });
      item.links = item.links.reduce(function(links, current_link) {
        links[current_link.link_type_name] = current_link.url;
        return links;
      }, {});
      item.links.itunes_url = "https://itunes.apple.com/us/app/id" + item.item.source_primary_id;
      return item;
    });
    res.json(items);
  });
});

router.post('/tag_items', function(req, res, next) {
  console.log(req.headers);
  if (! Array.isArray(req.body.item)) {
    req.body.item = [req.body.item];
  }
  console.log(req.body);

  var tag = req.body.tag;
  var items = req.body.item;

  model.Item.query().whereIn('id', items).then(function(items) {
    return Promise.all(items.map(function(item) {
      return item.addTag(tag);
    }));
  }).then(function() {
    res.json({ status: "OK" });
  });
});

router.get('/to_delete.json', function(req, res) {
  var q = model.ItemVersion.query()
    .orderBy('size_compressed_bytes', 'desc')
    .groupBy('item_id')
    //.having('')
    .eager('[links]');
  q = q.whereIn('item_id', model.itemIdsTagged('Delete'));
  q.then(function(items) {
    items = items.map(function(item) {
      return { name: item.name, file_path: item.file_path };
    });
    res.json(items);
  });
});

module.exports = router;
