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

exports.sequelize = sequelize;
exports.Person = Person;
