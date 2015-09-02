var Knex = require('knex');
var Model = require('objection').Model;

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
// Table name is the only required property.
Source.tableName = 'sources';
exports.Source = Source;



function Item() {
  Model.apply(this, arguments);
}
Model.extend(Item);
// Table name is the only required property.
Item.tableName = 'items';
/*
Item.relationMappings = {
  items: {
    relation: Model.OneToManyRelation,
    from: 'Items.source_code',
    to: 'Items.source_code'
  },
}
*/
exports.Item = Item;


function ItemVersion() {
  Model.apply(this, arguments);
}
Model.extend(ItemVersion);
// Table name is the only required property.
ItemVersion.tableName = 'items_versions';
ItemVersion.relationMappings = {
  item: {
    relation: Model.OneToManyRelation,
    from: 'ItemVersions.source_code',
    to: 'ItemVersions.source_code'
  },
}
exports.ItemVersion = ItemVersion;

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
 * - plist_json (TODO)
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
