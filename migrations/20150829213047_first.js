
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('sources', function(table) {
      table.string('source_code').primary();
      table.string('name').unique();
      table.string('url');
      table.timestamps();
    }),
    knex.schema.createTable('items', function(table) {
      table.increments('id').primary();
      table.string('source_code').index().notNullable();
      table.string('source_primary_id').notNullable();
      table.timestamp('deleted_at').index()
      table.integer('current_version_id').references('id').inTable('item_versions');
      table.timestamps();

      table.unique(['source_code', 'source_primary_id']);
    }),
    knex.schema.createTable('item_versions', function(table) {
      table.increments('id').primary();
      table.integer('item_id').notNullable().index().references('id').inTable('items');
      table.string('name').index().notNullable();
      table.string('version').notNullable();
      table.string('file_path').unique().notNullable();
      table.integer('size_compressed_bytes').notNullable();
      table.integer('size_uncompressed_bytes').notNullable();
      table.text('description');
      table.text('metadata_json');
      table.timestamps();

      table.unique(['id', 'version']);
    }),
    knex.schema.createTable('item_identifiers', function(table) {
      table.integer('item_id').notNullable().index().references('id').inTable('items');
      table.string('identifier_name').index().notNullable();
      table.string('value').notNullable();
      table.timestamps();

      table.primary(['item_id', 'identifier_name']);
    }),
    knex.schema.createTable('item_links', function(table) {
      table.integer('item_id').notNullable().index().references('id').inTable('items');
      table.string('link_type_name').index().notNullable();
      table.string('url').notNullable();
      table.timestamps();

      table.primary(['item_id', 'link_type_name']);
    }),
    knex.schema.createTable('tags', function(table) {
      table.increments('id').primary();
      table.string('name').index().unique().notNullable();
      table.timestamps();
    }),
    knex.schema.createTable('items_tags', function(table) {
      table.integer('item_id').notNullable().index().references('id').inTable('items');
      table.integer('tag_id').notNullable().index().references('id').inTable('tags');
      table.timestamps();

      table.primary(['item_id', 'tag_id']);
    })
  ]);
};

exports.down = function(knex, Promise) {
  knex.schema.dropTable('sources');
  knex.schema.dropTable('items');
  knex.schema.dropTable('item_versions');
  knex.schema.dropTable('item_identifiers');
  knex.schema.dropTable('item_links');
  knex.schema.dropTable('tags');
  knex.schema.dropTable('items_tags');
};
