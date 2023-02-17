const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const proyectosSchema = new Schema({
  nombre: {
    type: String,
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Proyectos", proyectosSchema);