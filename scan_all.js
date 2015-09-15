var model = require("./model.js");

var itunes_source = require('./sources/itunes.js');

itunes_source.scan(model).then(function(arg) {
  console.log("Callback got:", arg.length, "items, like", arg[0]);
  process.exit();
});


