var Promise = require("bluebird");
var fs = require("fs"),
    path = require('path');
var model = require("../model.js");
var archive = require('ls-archive')

Promise.promisifyAll(fs);
Promise.promisifyAll(archive);

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

function source() {
  return model.Source.query().where({
    source_code:SOURCE_CODE,
  }).then(function(rows) {
    if (rows.length == 0) {
      var now = Date.now();
      return model.Source.query().insert({
        source_code: SOURCE_CODE,
        name: "iTunes App Store",
        created_at: now,
        updated_at: now,
        // TODO URL?
      })
    } else {
      return rows[0];
    }
  });
}

exports.scan = function(progress_callback) {
  return source().then(function(iTunes) {
    //console.log("Got Source ", iTunes);
    var apps_dir = mobile_apps_dir()
    return fs.readdirAsync(apps_dir).then(function(items) {
      console.log("Found %d apps.", items.length);
      return Promise.all(items.map(function(filename) {
        return add_item_from_file(apps_dir, filename, iTunes, progress_callback);
      }));
    });
  });
}

function add_item_from_file(directory, filename, iTunes, progress_callback) {
  console.log("Adding", filename, "to", iTunes.source_code, "(" + iTunes.name + ")");

  var full_path = path.join(directory, filename);
  return read_info_plist(full_path).then(function(info) {
    console.log("App at", full_path, "has metadata", info);
    return [
      info,
      fs.statAsync(full_path),
      find_or_create_item(info.itemId, iTunes)
    ];
  }).spread(function(info, stat, item) {
    console.log("Populating item", item, "with stats", stats, "and plist", info);
    return item;
  }).catch(function(err) {
    console.log("FAILED", err);
  });

  /*
   * If an ItemVersion exists, return.
   *
   * Get file stats
   * Read plist: iTunesMetadata.plist
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
  return archive.readAsync(full_path, "iTunesMetadata.plist").then(
    function(contents) {
    return plist.parse(contents);
  });
}

function find_or_create_item(item_id, source) {
  console.log("Looking for item", item_id, "in", source.name);

  return model.Item.query().where({
    source_code: source.source_code,
    source_primary_id: item_id
  }).then(function(rows) {
    if (rows.length == 0) {
      console.log("CREATING Item", item_id);
      var now = Date.now();
      return model.Item.query().insert({
        source_code: source.source_code,
        source_primary_id: item_id,
        created_at: now,
        updated_at: now,
        // TODO add current_version_id later
      });
    } else {
      console.log("RETURNING Item", item_id, rows[0]);
      return rows[0];
    }
  }).catch(function(e) {
    console.log("WHAT.", e);
  });
}
