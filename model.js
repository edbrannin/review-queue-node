var Sequelize = require('sequelize');
var sequelize = new Sequelize('review_queue', 'username', 'password', {
  dialect: 'sqlite'
});

var Person = sequelize.define('Person', {
  username: Sequelize.STRING,
  name: Sequelize.STRING
}, {
  tableName: "people"
});

/*
 * TODO: Add the following models
 *
 * Source?
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
 * ItemNote
 * - item_id
 * - created_by
 * - note
 *
 *
 */

exports.sequelize = sequelize;
exports.Person = Person;
