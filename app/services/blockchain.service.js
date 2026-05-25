const findBlockByCelhash = (chain, celhash) => {
  for (let index = 1; index < chain.length; index += 1) {
    const block = chain[index];
    if (block.data[0].celhash === celhash) return block;
  }
  return null;
};

const mineAndSync = ({ blockchain, p2pServer, data, consensusMeta }) => {
  p2pServer.syncChains();
  const block = blockchain.addBlock(data, consensusMeta);
  p2pServer.syncChains();
  return block;
};

module.exports = {
  findBlockByCelhash,
  mineAndSync
};
