const SHA256 = require('crypto-js/sha256');
const ConfigEnv = require('../app/config');

class Block {
  constructor(timestamp, lastHash, hash, data, difficulty) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.data = [{
      celhash : data.celhash,
      voto1 : data.voto1,
      voto2 : data.voto2,
      voto3 : data.voto3 //,
      //voto4 : data.voto4
    }];
    this.difficulty = difficulty || ConfigEnv.DIFFICULTY;
  }

  toString() {
    return `Block -
      Timestamp : ${this.timestamp}
      Last Hash : ${this.lastHash.substring(0, 10)}
      Hash      : ${this.hash.substring(0, 10)}
      Difficulty: ${this.difficulty}
      Data      : ${this.data}`;
  }

  static genesis() {
    let falso_timestamp = new Date(2021,1,1); //.getTime();
    return new this(falso_timestamp, '00000000000000000000000000000000000000000000000000000000', '00000000000000000000000000000000000000000000000000000000',
      [{celhash : null,
        voto1 : null,
        voto2 : null,
        voto3 : null,
        //voto4 : null
      }], ConfigEnv.DIFFICULTY);
  }

  static mineBlock(lastBlock, data) {
    let hash, timestamp;
    const lastHash = lastBlock.hash;
    let { difficulty } = lastBlock;

    do {
      timestamp = new Date() ;
      hash = Block.hash(timestamp, lastHash, data, difficulty);
    } while (hash.substring(0, difficulty) !== '0'.repeat(difficulty));

    return new this(timestamp, lastHash, hash, data, difficulty);
  }

  static hash(timestamp, lastHash, data, difficulty) {
    return this.hash(`${timestamp}${lastHash}${data}${difficulty}`).toString();
  }

  static blockHash(block) {
    const { timestamp, lastHash, data, difficulty } = block;
    return Block.hash(timestamp, lastHash, data, difficulty);
  }

  static hash(data) {
    return SHA256(JSON.stringify(data)).toString();
  }
}

module.exports = Block;