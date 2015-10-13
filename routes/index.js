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
    .eager('[item, tags]');
  //TODO Filter by tags
  q.then(function(items) {
    items = items.map(function(item) {
      item.tags = item.tags.map(function(tag) { return tag.name; });
      item.links = { softwareIcon57x57URL: "http://lorempixel.com/57/57/" };
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
