const SHA256 = require('crypto-js/sha256');
const ConfigEnv = require('../app/config');

class Block {
  constructor(timestamp, lastHash, hash, data, difficulty, consensusMeta = {}) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.data = [data];
    this.difficulty = difficulty || ConfigEnv.DIFFICULTY;
    this.consensus = consensusMeta;
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
      { celhash: null, voto1: null }, ConfigEnv.DIFFICULTY, { slot: 0, leaderId: 'genesis', height: 0 });
  }

  static mineBlock(lastBlock, data, consensusMeta = {}) {
    let hash, timestamp;
    const lastHash = lastBlock.hash;
    let { difficulty } = lastBlock;

    do {
      timestamp = new Date() ;
      hash = Block.hash(timestamp, lastHash, data, difficulty, consensusMeta);
    } while (hash.substring(0, difficulty) !== '0'.repeat(difficulty));

    return new this(timestamp, lastHash, hash, data, difficulty, consensusMeta);
  }

  static hash(timestamp, lastHash, data, difficulty, consensusMeta = {}) {
    return this.hash(`${timestamp}${lastHash}${JSON.stringify(data)}${difficulty}${JSON.stringify(consensusMeta)}`).toString();
  }

  static blockHash(block) {
    const { timestamp, lastHash, data, difficulty, consensus } = block;
    return Block.hash(timestamp, lastHash, data, difficulty, consensus);
  }

  static hash(data) {
    return SHA256(JSON.stringify(data)).toString();
  }
}

module.exports = Block;
