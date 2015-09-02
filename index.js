var model = require("./model.js");

var itunes_source = require('./sources/itunes.js');

itunes_source.scan(model, function(model, iTunes) {
  //console.log("Callback got:", iTunes);
  process.exit();
});


