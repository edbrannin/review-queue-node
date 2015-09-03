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
  }).then(function(rows) {
    if (rows.length == 0) {
      var now = Date.now();
      model.Source.query().insert({
        source_code: SOURCE_CODE,
        name: "iTunes App Store",
        created_at: now,
        updated_at: now,
        // TODO URL?
      }).then(callback);
    } else {
      callback(rows[0]);
    }
  });
}

exports.scan = function(model, callback, progress_callback) {
  source(model, function(iTunes) {
    //console.log("Got Source ", iTunes);
    var apps_dir = mobile_apps_dir()
    fs.readdirAsync(apps_dir).then(function(items) {
      console.log("Found %d apps.", items.length);
      return items.map(function(item) {
        add_item_from_file(apps_dir, item, iTunes, progress_callback);
      });
    }).then(callback);
  });
}

function add_item_from_file(directory, filename, iTunes, progress_callback) {
  console.log("Adding", filename, "to", iTunes.source_code, "(" + iTunes.name + ")");

  var full_path = path.join(directory, filename);
  return read_info_plist(full_path).then(function(info) {
    console.log("App at", full_path, "has stats", info);
    return [info, fs.statAsync(full_path), find_or_create_item(info, iTunes)];
  }).spread(function(info, stat, item) {
    console.log("Populating item", item, "with stats", stats, "and plist", info);
  }).done();
  /*
   * If an ItemVersion exists, return.
   *
   * Get file stats
   * Read plist
   * Add new Item, if needed
   *
   * Add new ItemVersion
   * Add Identifiers
   * Add links
   * TODO: Also get links for iTunes pictures
   * Add Genre, Age-rating tags
   * Ping progress_callback -- how to report number completed?
   *
    item.source_item_id = item.plist['itemId']
    item.source_item_id2 = item.plist['softwareVersionBundleId']
    item.name = item.plist['itemName']
   *
   */
}

function read_info_plist(full_path) {
  return Promise.resolve({});
}

function find_or_create_item(item_id, iTunes) {
  model.Item.query().where({
    source_code: iTunes.SOURCE_CODE,
    source_primary_id: item_id
  }).then(function(rows) {
    if (rows.length == 0) {
      var now = Date.now();
      return model.Item.query().insert({
        source_code: iTunes.SOURCE_CODE,
        source_primary_id: item_id,
        created_at: now,
        updated_at: now,
        // TODO add current_version_id later
      });
    } else {
      return rows[0];
    }
  });
}
