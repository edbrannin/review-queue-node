console.log("Hi!");

var model = require("./model.js");

console.log("Mom");

model.sequelize.sync().then(function() {
  return model.Person.create({
    username: 'edbrannin',
    name: 'Ed'
  });
}).then(function(ed) {
  console.log(ed.get({
    plain: true
  }))
});
