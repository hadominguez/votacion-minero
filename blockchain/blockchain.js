const Block = require('./block');
const Blocks = require('./db/blocks');

class Blockchain {
  constructor () {}

  async cargaChain(blockchain) {
    const datos = await Blocks.findAll();
    if (datos.length >= 1) {
      blockchain.chain = datos.map((item) => ({
        timestamp: item.timestamp,
        lastHash: item.lastHash,
        hash: item.hash,
        data: item.data,
        difficulty: item.difficulty,
        consensus: item.consensus || {}
      }));
    }

    if (!this.chain || datos.length < 1) {
      const block = Block.genesis();
      blockchain.chain = [block];
      await this.saveBlock(block);
    }
    return blockchain;
  }

  addBlock(data, consensusMeta = {}) {
    const block = Block.mineBlock(this.chain[this.chain.length - 1], data, consensusMeta);
    this.chain.push(block);
    this.saveBlock(block);
    return block;
  }

  getHeight() {
    return (this.chain?.length || 1) - 1;
  }

  getBlocksFromHeight(fromHeight = 0) {
    const index = Math.max(0, Number(fromHeight) + 1);
    return (this.chain || []).slice(index);
  }

  async saveBlock(block) {
    const datas = Array.isArray(block.data) && block.data.length >= 1 ? [block.data[0]] : [];
    const existingBlock = await Blocks.findByHashes(block.lastHash, block.hash);
    if (existingBlock) return;

    const celhash = block.data?.[0]?.celhash;
    if (celhash) {
      const duplicateByCelhash = await Blocks.findByCelhash(celhash);
      if (duplicateByCelhash) return;
    }

    try {
      await Blocks.insert({
        hash: block.hash,
        lastHash: block.lastHash,
        timestamp: block.timestamp,
        data: datas,
        difficulty: block.difficulty,
        consensus: block.consensus || {}
      });
    } catch (error) {
      if (error && error.code === '23505') return;
      throw error;
    }
  }

  isValidChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

    for (let index = 1; index < chain.length; index += 1) {
      const block = chain[index];
      const lastBlock = chain[index - 1];

      if (block.lastHash !== lastBlock.hash || block.hash !== Block.blockHash(block)) {
        return false;
      }
    }

    return true;
  }

  replaceChain(newChain) {
    if (!newChain) return;

    if (this.chain) {
      if (newChain.length <= this.chain.length) {
        console.log('La cadena recibida no es más larga que la cadena actual.');
        return;
      }
      if (!this.isValidChain(newChain)) {
        console.log('La cadena recibida no es valida.');
        return;
      }
    }

    for (let index = 1; index < newChain.length; index += 1) {
      this.saveBlock(newChain[index]);
    }

    console.log('Reemplazo de blockchain con la nueva cadena.');
    this.chain = newChain;
  }
}

module.exports = Blockchain;
