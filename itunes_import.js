var model = require("./model.js");


var SOURCE_CODE = 'ITUNES';

var iTunes = model.Source.query().where({
  source_code:SOURCE_CODE,
}).then(function(row) {
  if (row.length == 0) {
    return model.Source.query().insert({
      source_code: SOURCE_CODE,
      name: "iTunes App Store",
      // TODO URL?
    });
  } else {
    return row;
  }
}).then(function() {
  exports.iTunes = iTunes.value();
});

