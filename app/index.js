const Blockchain = require('../blockchain/blockchain');
const { initDatabase } = require('../blockchain/db/database');
const P2pServer = require('./p2p-server');
const createApp = require('./app');
const ConfigEnv = require('./config');
const mempoolService = require('./services/mempool.service');
const blockchainController = require('./controllers/blockchain.controller');
const consensusState = require('./services/consensus-state.service');
const fetch = require('node-fetch');

const HTTP_PORT = ConfigEnv.HTTP_PORT || 3001;
const RETRY_MS = 3000;
const MAX_RETRIES = 20;
const RESYNC_INTERVAL_MS = 5000;
const MAX_SYNC_STEPS = 200;

const waitForDatabase = async () => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await initDatabase();
      return;
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      console.log(`Esperando PostgreSQL (${attempt}/${MAX_RETRIES})...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    }
  }
};

const applyBlocksInOrder = async (blockchain, blocks) => {
  const pending = [...blocks].sort((a, b) => (a?.consensus?.height || 0) - (b?.consensus?.height || 0));
  let progress = true;
  let steps = 0;
  while (progress && pending.length > 0 && steps < MAX_SYNC_STEPS) {
    progress = false;
    steps += 1;
    for (let index = pending.length - 1; index >= 0; index -= 1) {
      const block = pending[index];
      if (blockchain.chain.find((item) => item.hash === block.hash)) {
        pending.splice(index, 1);
        progress = true;
        continue;
      }
      if (block?.consensus?.height !== blockchain.chain.length) continue;
      if (block.lastHash !== blockchain.chain[blockchain.chain.length - 1].hash) continue;
      blockchain.chain.push(block);
      await blockchain.saveBlock(block);
      pending.splice(index, 1);
      progress = true;
    }
  }
};

const getPeerBaseUrl = (peerUrl) => peerUrl.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:').replace(/:\d+$/, ':3001');

const resyncWithPeers = async (blockchain) => {
  const peers = (ConfigEnv.PEERS || '').split(',').map((item) => item.trim()).filter(Boolean);
  const auth = { usuario: ConfigEnv.USER_API, contrasena: ConfigEnv.PASS_API };
  const peerHeights = [];
  for (const peerUrl of peers) {
    try {
      const baseUrl = getPeerBaseUrl(peerUrl);
      const heightResponse = await fetch(`${baseUrl}/height`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auth)
      });
      if (!heightResponse.ok) continue;
      const { height: peerHeight } = await heightResponse.json();
      peerHeights.push({ baseUrl, peerHeight });
    } catch (_) {}
  }

  peerHeights.sort((a, b) => b.peerHeight - a.peerHeight);
  for (const peer of peerHeights) {
    try {
      if (peer.peerHeight <= blockchain.getHeight()) continue;
      let safety = 0;
      while (blockchain.getHeight() < peer.peerHeight && safety < MAX_SYNC_STEPS) {
        safety += 1;
        const myHeight = blockchain.getHeight();
        const fromHeight = Math.max(-1, myHeight);
        const blocksResponse = await fetch(`${peer.baseUrl}/blocks-from`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...auth, fromHeight })
        });
        if (!blocksResponse.ok) break;
        const { blocks } = await blocksResponse.json();
        if (!Array.isArray(blocks) || blocks.length === 0) break;
        const previousHeight = blockchain.getHeight();
        await applyBlocksInOrder(blockchain, blocks);
        if (blockchain.getHeight() === previousHeight) break;
      }
    } catch (_) {}
  }
};

const bootstrap = async () => {
  const blockchain = new Blockchain();
  const p2pServer = new P2pServer(blockchain);
  p2pServer.setTxHandler((tx) => {
    mempoolService.addTx(tx);
  });
  p2pServer.setBlockHandler(blockchainController.receiveBlockFromPeer({ blockchain, p2pServer }));
  p2pServer.setAckHandler(blockchainController.receiveAckFromPeer());
  p2pServer.setProposeHandler(blockchainController.receiveProposeFromPeer({ blockchain, p2pServer }));
  p2pServer.setVoteHandler(blockchainController.receiveVoteFromPeer({ p2pServer }));
  p2pServer.setCommitHandler(blockchainController.receiveCommitFromPeer({ blockchain }));
  p2pServer.setResyncHandler(blockchainController.resyncOnReconnect({ p2pServer }));
  p2pServer.setPeerOpenHandler(blockchainController.syncFromPeerByHeight({ blockchain }));
  p2pServer.setPrevoteHandler(blockchainController.receivePrevoteFromPeer({ p2pServer }));
  p2pServer.setPrecommitHandler(blockchainController.receivePrecommitFromPeer({ p2pServer }));
  const app = createApp({ blockchain, p2pServer });

  await waitForDatabase();
  await blockchain.cargaChain(blockchain);
  consensusState.setHeight(blockchain.getHeight());
  setInterval(() => { resyncWithPeers(blockchain); }, RESYNC_INTERVAL_MS);

  app.listen(HTTP_PORT, () => console.log(`Escuchando en el puerto ${HTTP_PORT}`));
  p2pServer.listen();
};

bootstrap().catch((error) => {
  console.error('Error al iniciar servicio minero:', error);
  process.exit(1);
});
