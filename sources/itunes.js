var fs = require('fs'),
    path = require('path');

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
    var path = path.join(getUserHome(), paths[x])
    if (fs.existsSync(path)) {
      return path;
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
    callback(model, iTunes);
  });
}
