const mongoose = require('mongoose');
const database = require('./db/database');
const Block = require('./block');
const Blockes = require('./db/blocks');

class Blockchain {
  constructor() {
    const arrayBlockes = Blockes.find();
    if(arrayBlockes.count >= 1){
      this.chain = arrayBlockes;
    }else{
      let block = Block.genesis();
      this.chain = [block];
      this.saveBlock(block);
    }
  }

  addBlock(data) {
    let block = Block.mineBlock(this.chain[this.chain.length-1], data);
    this.chain.push(block);
    this.saveBlock(block);
    return block;
  }

  saveBlock(block){
    let datas = [{
      celhash : block.data[0].celhash,
      voto1 : block.data[0].voto1,
      voto2 : block.data[0].voto2,
      voto3 : block.data[0].voto3 //,
      //voto4 : block.data[0].voto4
    }];

    Blockes.findOne({lastHash: block.lastHash, hash: block.hash}, function (err, datos) {

      if(!datos){
        let bloque = new Blockes({_id : new mongoose.Types.ObjectId, timestamp: block.timestamp, lastHash: block.lastHash, hash: block.hash, data: datas ,difficulty: block.difficulty });
        bloque.save(function(err){
          if( err ){ console.log('Error: ', err); return; }
          console.log("Datos Guardados.");
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
    if (newChain.length <= this.chain.length) {
      console.log('La cadena recibida no es más larga que la cadena actual.');
      return;
    } else if (!this.isValidChain(newChain)) {
      console.log('La cadena recibida no es valida.');
      return;
    }

    for (let i=1; i<newChain.length; i++) {
      let block = newChain[i];
      this.saveBlock(block);
    }

    console.log('Reemplazo de blockchain con la nueva cadena.');
    this.chain = newChain;

  }
}

module.exports = Blockchain;