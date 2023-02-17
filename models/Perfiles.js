const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const perfilesSchema = new Schema({
  nombre: {
    type: String,
    required: true,
  },
  apellido: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  experiencia: {
    type: String,
    required: true,
  },
  texto:{
    type: String,
    required: false,
  },
  img:{
    type: String,
    required: false,
  },
  rol:{
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Perfiles", perfilesSchema);