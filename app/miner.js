
class Miner {
  constructor(blockchain, p2pServer) {
    this.blockchain = blockchain;
    this.p2pServer = p2pServer;
  }

  mine(data) {
    this.p2pServer.syncChains();
    const block = this.blockchain.addBlock(data);
    this.p2pServer.syncChains();

    return block;
  }
}

module.exports = Miner;