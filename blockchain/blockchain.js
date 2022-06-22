const mongoose = require('mongoose');
const database = require('./db/database');
const Block = require('./block');
const Blockes =  require('./db/blocks');

class Blockchain {
  constructor () {
  }

  async cargaChain(blochain) {
    var datos = await Blockes.find({});
    if(datos.length >= 1){
      var chains =[];
      for(let i=0; i< datos.length; i++){
        chains.push( new Blockes({_id : datos[i].hash, timestamp: datos[i].timestamp, lastHash: datos[i].lastHash, hash: datos[i].hash, data: datos[i].data ,difficulty: datos[i].difficulty }) );
      }
      blochain.chain = chains;
    }

    if(!this.chain || datos.length < 1){
      var block = Block.genesis();
      blochain.chain = [ block ];
      this.saveBlock(block);
    }
    return blochain;
  }

  addBlock(data) {
    let block = Block.mineBlock(this.chain[this.chain.length-1], data);
    this.chain.push(block);
    this.saveBlock(block);
    return block;
  }

  saveBlock(block){
    console.log(block);
    var datas;
    if(block.data.length >= 1){
      datas = [{
        celhash : block.data[0].celhash,
        voto1 : block.data[0].voto1,
        voto2 : block.data[0].voto2,
        voto3 : block.data[0].voto3 //,
        //voto4 : block.data.voto4
      }];
    }

    Blockes.findOne({lastHash: block.lastHash, hash: block.hash}, function (err, datos) {

      if(!datos){
        Blockes.findOne({"data.celhash": block.data[0].celhash}, function (err, dato_blocke) {

          console.log(dato_blocke);
          if(!dato_blocke){
            console.log("entra");
            let bloque = new Blockes({_id : block.hash, timestamp: block.timestamp, lastHash: block.lastHash, hash: block.hash, data: datas ,difficulty: block.difficulty });
            bloque.save(function(err){
              if( err ){ console.log('Error: ', err); return; }
              console.log("Datos Guardados.");
            });
          }

        });
      }

    });
    

  }

  isValidChain(chain) {
    if(JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

    for (let i=1; i<chain.length; i++) {
      const block = chain[i];
      const lastBlock = chain[i-1];

      if (block.lastHash !== lastBlock.hash ||
          block.hash !== Block.blockHash(block)) {
        return false;
      }
    }

    return true;
  }

  replaceChain(newChain) {
    if(newChain){

      if(this.chain){
        if (newChain.length <= this.chain.length) {
          console.log('La cadena recibida no es más larga que la cadena actual.');
          return;
        } else if (!this.isValidChain(newChain)) {
          console.log('La cadena recibida no es valida.');
          return;
        }
      }

      for (let i=1; i<newChain.length; i++) {
        let block = newChain[i];
        this.saveBlock(block);
      }

      console.log('Reemplazo de blockchain con la nueva cadena.');
      this.chain = newChain;

    }
  }
}

module.exports = Blockchain;