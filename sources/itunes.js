var SOURCE_CODE = 'ITUNES';

function source(model, callback) {
  model.Source.query().where({
    source_code:SOURCE_CODE,
  }).then(function(row) {
    if (row.length == 0) {
      var now = Date.now();
      var iTunes = model.Source.query().insert({
        source_code: SOURCE_CODE,
        name: "iTunes App Store",
        created_at: now,
        updatd_at: now,
        // TODO URL?
      });
    } else {
      var iTunes = row[0];
    }
    callback(iTunes);
  });
}

exports.scan = function(model, callback, progress_callback) {
  source(model, function(iTunes) {
    console.log("Got Source ", iTunes);
    callback(model);
  });
}
