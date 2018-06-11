var mongoose = require('mongoose');

// 
var UsersSchema   = new mongoose.Schema({
  Numid: String,
  Contrasena: String,
  imagen: String
});

// Export the Mongoose model
module.exports = mongoose.model('User', UsersSchema);