const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eventosSchema = new Schema({
  tema: {
    type: String,
    required: true,
  },
  fecha: {
    type: Date,
    required: true,
  },
  duracion: {
    type: String,
    required: false,
  },
  modalidad: {
    type: String,
    required: false,
  },
  descripcion:{
    type: String,
    required: false,
  },
  img:{
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("Eventos", eventosSchema);