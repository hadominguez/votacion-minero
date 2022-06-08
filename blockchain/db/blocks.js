const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blockSchema = new Schema({
    _id: String,
    timestamp : Date,
    lastHash : String,
    hash : String,
    data : [{
        celhash : String,
        voto1 : Number,
        voto2 : Number,
        voto3 : Number //,
        //voto4 : Number
  }],
  difficulty : Number
});

// Crear el modelo
const Block = mongoose.model('Block', blockSchema);

module.exports = Block;
