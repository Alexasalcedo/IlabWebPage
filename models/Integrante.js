const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const IntegrantesSchema = new Schema({
    nombre_proyecto:{
        type:String,
        require: true,
    },
    integrante: {
        type: String,
        required: true,
    },
    correo: {
        type: String,
        required: false,
    },
    carrera: {
        type: String,
        required: false,
    },
    img:{
        type: String,
        required: false,
    },
});

module.exports = mongoose.model("Integrantes", IntegrantesSchema);