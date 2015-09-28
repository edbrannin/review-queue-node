var Promise = require("bluebird");
var fs = require("fs"),
    path = require('path');
var model = require("../model.js");
var plist = require('simple-plist');
var archive = require('../deps/node-ls-archive/');

Promise.longStackTraces();

archive.configureExtensions({ zip: ['.ipa']});

Promise.promisifyAll(fs);
Promise.promisifyAll(archive);

var SOURCE_CODE = 'ITUNES';

var DEBUG_ITEM_LIMIT = 15;

// http://stackoverflow.com/a/2548133/25625
if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

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
      //DEBUGGING
      if (DEBUG_ITEM_LIMIT) {
        items = items.slice(0, DEBUG_ITEM_LIMIT);
      }
      return Promise.all(items.map(function(filename) {
        return add_item_from_file(apps_dir, filename, iTunes, progress_callback);
      }));
    });
  });
}

function add_item_from_file(directory, filename, iTunes, progress_callback) {
  if (! filename.endsWith('.ipa')) {
    console.log("Skipping", filename);
    return Promise.resolve(undefined);
  }
  console.log("Adding", filename, "to", iTunes.source_code, "(" + iTunes.name + ")");

  var full_path = path.join(directory, filename);
  return model.ItemVersion.query().where({
    file_path: full_path,
  }).then(function(rows) {
    if (rows.length > 0) {
      console.log("Skipping already-imported:", full_path);
      return Promise.resolve(full_path);
    } else {
      console.log("Importing:", full_path);
      return read_info_plist(full_path).then(function(info) {
        //console.log("App at", full_path, "has metadata", info);
        return [
          info,
          find_or_create_item(info.itemId, iTunes)
        ];
      }).spread(function(info, item) {
        return [
          full_path,
          info,
          fs.statAsync(full_path),
          item
        ];
      }).spread(populate_item).catch(function(err) {
        console.error(err.stack);
      });
    }
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

function tags_for_metadata(metadata) {
  // https://developer.xamarin.com/guides/ios/deployment,_testing,_and_metrics/app_distribution/itunesmetadata/#iTunesMetadata_4
  var tags = [];

  tags.push(metadata.priceDisplay);
  tags.push(metadata.artistName);
  tags.push(metadata.genre);

  if (metadata.subgenres) {
    metadata.subgenres.forEach(function(subgenre) {
      tags.push(subgenre.genre);
    });
  }

  if (metadata.rating) {
    tags.push(metadata.rating.label);
  }

  if (metadata.gameCenterEnabled) {
    tags.push("gameCenterEnabled");
  }

  if (metadata.softwareSupportedDeviceIds.indexOf(4) == -1) {
    tags.push('iPhone');
  } else if (metadata.softwareSupportedDeviceIds.length > 1) {
    //FIXME May not be accurate after Apple TV & Watch apps
    tags.push('Universal');
  } else {
    tags.push('iPad');
  }

  console.log("App with Bundle ID", metadata.softwareVersionBundleId, "getting tagged with", tags);

  return tags;
}

function populate_item(full_path, metadata, stats, item) {
  //console.log("populate_item(", full_path, metadata, stats, item, hasVersion, ")");
  //console.log("Populating item", item, "with stats", stats, "and plist", metadata);
  console.log("Saving info for", full_path);
  var now = Date.now();

  return Promise.all([
    // TODO http://vincit.github.io/objection.js/global.html#transaction
    // TODO add current_version_id later
    model.ItemVersion.query().insert({
      item_id: item.id,
      created_at: now,
      updated_at: now,
      name: metadata.itemName,
      version: metadata.bundleShortVersionString || metadata.priceDisplay || "0",
      file_path: full_path,
      size_compressed_bytes: stats.size,
      size_uncompressed_bytes: 0,
      metadata_json: JSON.stringify(metadata),
      //TODO metadata.releaseDate
      //TODO metadata.purchaseDate
    }),
    metadata.bundleDisplayName && item.setIdentifier('display_name', metadata.bundleDisplayName),
    item.setIdentifier('item_name', metadata.itemName),
    item.setIdentifier('bundle_id', metadata.softwareVersionBundleId),
    Promise.all(tags_for_metadata(metadata).map(item.addTag.bind(item))),
    item.setLink('softwareIcon57x57URL', metadata.softwareIcon57x57URL),
    //TODO add Link to iTunes Store
  ]).then(function() {
    console.log("Done importing", full_path);
  });
}

function read_info_plist(full_path) {
  return archive.readFileAsync(full_path, "iTunesMetadata.plist").then(
    function(contents) {
      return plist.parse(contents);
    }
  );
}

function find_or_create_item(item_id, source) {
  //console.log("Looking for item", item_id, "in", source.name);

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
    console.error(e.stack);
  });
}
