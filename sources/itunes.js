var Promise = require("bluebird");
var fs = require("fs"),
    path = require('path');

Promise.promisifyAll(fs);

var SOURCE_CODE = 'ITUNES';

/*
 * http://stackoverflow.com/questions/9080085/node-js-find-home-directory-in-platform-agnostic-way
 */
function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function find_itunes_root() {
  paths = [
    "Music/iTunes/iTunes Music/"
  ]
  for (var x = 0; x < paths.length; x+= 1) {
    var p = path.join(getUserHome(), paths[x])
    if (fs.existsSync(p)) {
      return p;
    }
  }
}

function mobile_apps_dir() {
  return path.join(find_itunes_root(), "Mobile Applications");
}

function source(model, callback) {
  model.Source.query().where({
    source_code:SOURCE_CODE,
  }).then(function(row) {
    if (row.length == 0) {
      var now = Date.now();
      model.Source.query().insert({
        source_code: SOURCE_CODE,
        name: "iTunes App Store",
        created_at: now,
        updated_at: now,
        // TODO URL?
      }).then(callback);
    } else {
      callback(row[0]);
    }
  });
}

exports.scan = function(model, callback, progress_callback) {
  source(model, function(iTunes) {
    //console.log("Got Source ", iTunes);
    fs.readdirAsync(mobile_apps_dir()).then(function(items) {
      console.log("Found %d apps.", items.length);
      items.forEach(function(item) {
        add_item_from_file(item, iTunes);
      });
    }).then(callback);
  });
}

function add_item_from_file(item, iTunes) {
  console.log("Adding", item, "to", iTunes.source_code, "(" + iTunes.name + ")");
}
