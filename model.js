var Knex = require('knex');
var objection = require('objection');
var Model = objection.Model;

//TODO Config-per-nvironment & unit tests
var knex = Knex({
  client: 'sqlite3',
  connection: {
    filename: 'dev.sqlite3'
  }
});

Model.knex(knex);

/*
 * TODO: Add the following models
 *
 *
 * ItemNote
 * - item_id
 * - created_by
 * - note
 *
 * People
 * - name
 * - auth details???
 *
 */

function Source() {
  Model.apply(this, arguments);
}
Model.extend(Source);
Source.tableName = 'sources';
exports.Source = Source;


function Item() {
  Model.apply(this, arguments);
}
Model.extend(Item);
Item.tableName = 'items';
exports.Item = Item;


function ItemVersion() {
  Model.apply(this, arguments);
}
Model.extend(ItemVersion);
ItemVersion.tableName = 'item_versions';
exports.ItemVersion = ItemVersion;

function ItemIdentifier() {
  Model.apply(this, arguments);
}
Model.extend(ItemIdentifier);
ItemIdentifier.tableName = 'item_identifiers';
exports.ItemIdentifier = ItemIdentifier;

function Tag() {
  Model.apply(this, arguments);
}
Model.extend(Tag);
Tag.tableName = 'tags';
exports.Tag = Tag;

function ItemTag() {
  Model.apply(this, arguments);
}
Model.extend(ItemTag);
ItemTag.tableName = 'items_tags';
exports.ItemTag = ItemTag;

function ItemLink() {
  Model.apply(this, arguments);
}
Model.extend(ItemLink);
ItemLink.tableName = 'item_links';
exports.ItemLink = ItemLink;

//Relationships

Source.relationMappings = {
  items: {
    relation: Model.OneToManyRelation,
    modelClass: Item,
    join: {
      from: 'items.source_code',
      to: 'sources.source_code'
    },
  },
}

Item.relationMappings = {
  versions: {
    relation: Model.OneToManyRelation,
    modelClass: ItemVersion,
    join: {
      from: 'items.id',
      to: 'item_versions.item_id'
    },
  },
  source: {
    relation: Model.OneToOneRelation,
    modelClass: Source,
    join: {
      from: 'items.source_code',
      to: 'sources.source_code'
    },
  },
  //TODO Tags
  //TODO Identifiers
  //TODO Links
}

ItemVersion.relationMappings = {
  item: {
    relation: Model.OneToOneRelation,
    modelClass: Item,
    join: {
      from: 'items.id',
      to: 'item_versions.item_id'
    },
  },
  //TODO Tags
  //TODO Identifiers
  //TODO Links
}

ItemIdentifier.relationMappings = {
  item: {
    relation: Model.OneToOneRelation,
    modelClass: Item,
    join: {
      from: 'items.id',
      to: 'item_identifiers.item_id'
    },
  },
}

// Sugar

// TODO Test
Item.prototype.setIdentifier = function(identifier_name, value) {
  var now = Date.now();
  var existing_ientifier = ItemIdentifier.query().where({
    item_id: this.id,
    identifier_name: identifier_name,
  })
  return existing_ientifier.bind(this).then(function(rows) {
    if (rows.length == 0) {
      return ItemIdentifier.query().insert({
        item_id: this.id,
        identifier_name: identifier_name,
        value: value,
        created_at: now,
        updated_at: now,
      });
    } else {
      return existing_ientifier.update({
        value: value,
        updated_at: now,
      });
    }
  });
}

Item.prototype.addTag = function(tag_name) {
  if (! tag_name) {
    //Silently ignore undefined
    return tag_name;
  }

  var now = Date.now();
  var item_id = this.id;
  if (! item_id) {
    throw new Error("Unknown Item ID: " + this);
  }
  return Tag.withName(tag_name).then(function(tag) {
    return ItemTag.query().where({
      tag_id: tag.id,
      item_id: item_id,
    }).then(function(rows) {
      if (rows.length > 0) {
        return rows[0];
      } else {
        return ItemTag.query().insert({
          tag_id: tag.id,
          item_id: item_id,
          created_at: now,
          updated_at: now,
        });
      }
    });
  });
}

Tag.withName = function(tag_name) {
  return objection.transaction(Tag, function(Tag) {
    return Tag.query().where({
      name: tag_name,
    }).then(function(rows) {
      if (rows.length == 0) {
        var now = Date.now();
        return Tag.query().insert({
          name: tag_name,
          created_at: now,
          updated_at: now,
        });
      } else {
        return rows[0];
      }
    });
  });
}

Item.prototype.setLink = function(name, url) {
  var now = Date.now();
  var q = ItemLink.query().where({
    item_id: this.id,
    link_type_name: name,
  });
  return q.bind(this).then(function(rows) {
    if (rows.length == 0) {
      return ItemLink.query().insert({
        item_id: this.id,
        link_type_name: name,
        url: url,
        created_at: now,
        updated_at: now,
      });
    } else {
      return q.update({
        url: url,
        updated_at: now,
      });
    }
  });
}

/*
 * Migrations written:
 *
 * Source
 * - name
 * - source_code
 * - url
 *
 * Item
 * - source_code
 * - source_primary_id
 * - current_version_id
 *
 * ItemVersion
 * - item_id
 * - name
 * - version
 * - size_compressed_bytes
 * - size_uncompressed_bytes
 * - description
 * - file_path
 * - metadata_json
 *
 * ItemIdentifier
 * - item_id
 * - identifier_name
 * - value
 *
 * ItemLink
 * - item_id
 * - link_type_name
 * - url
 *
 * Tag
 * - name
 *
 * ItemTag
 * - item_id
 * - tag_id
 * - created_by => Person.id
 *
 */



exports.sources = function() {
  return Source.query();
}
