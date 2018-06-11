var mongoose = require('mongoose');

// 
var EmpleadosSchema   = new mongoose.Schema({
  Tipoid: String,
  Numid: String,
  Nombres: String,
  Apellidos: String,
  Edad: String,
  Genero: String,
  Cargo: String,

});

// Export the Mongoose model
module.exports = mongoose.model('Empleado', EmpleadosSchema);