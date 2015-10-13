var Promise = require("bluebird");
var express = require('express');
var router = express.Router();

var model = require('../model.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Bridget' });
});

router.get('/queue.json', function(req, res, next) {
  var q = model.ItemVersion.query()
    .limit(12)
    .orderBy('size_compressed_bytes', 'desc')
    .groupBy('item_id')
    //.having('')
    .eager('[item, tags, links]');
    //
  //TODO Filter by tags
  var exclude_tags = ['Keep', 'Delete', 'Backlog'];
  var tagSubquery = model.Tag.query().select('id').whereIn('name', exclude_tags)
  if (false) {
    tagSubquery = tagSubquery.whereIn('name', include_tags);
  }
  var hideTags = model.ItemTag.query().select('item_id').whereIn('tag_id', tagSubquery);
  q.whereNotIn('item_id', hideTags);

  q.then(function(items) {
    items = items.map(function(item) {
      item.tags = item.tags.map(function(tag) { return tag.name; });
      item.links = item.links.reduce(function(links, current_link) {
        links[current_link.link_type_name] = current_link.url;
        return links;
      }, {});
      return item;
    });
    res.json(items);
  });
});

router.post('/tag_items', function(req, res, next) {
  console.log(req);
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

module.exports = router;
