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
    .eager('item');
  //TODO Filter by tags
  q.then(function(items) {
    items = items.map(function(item) {
      item.tags = [];
      item.links = { softwareIcon57x57URL: "http://lorempixel.com/57/57/" };
      return item;
    });
    res.json(items);
  });
});

module.exports = router;
