const Websocket = require('ws');
const ConfigEnv = require('./config');
const p2pAuth = require('./services/p2p-auth.service');

const P2P_PORT = ConfigEnv.P2P_PORT || 5000;

const peers = ConfigEnv.PEERS ? ConfigEnv.PEERS.split(',') : [];
const MESSAGE_TYPES = {
  chain: 'CHAIN',
  tx: 'TX',
  block: 'BLOCK',
  ack: 'ACK',
  heartbeat: 'HEARTBEAT',
  propose: 'PROPOSE',
  vote: 'VOTE',
  commit: 'COMMIT'
  ,
  prevote: 'PREVOTE',
  precommit: 'PRECOMMIT'
};

class P2pServer {
  constructor(blockchain ) {
    this.blockchain = blockchain;
    this.sockets = [];
    this.activeNodes = new Map([[ConfigEnv.NODE_ID, Date.now()]]);
  }

  listen() {
    const server = new Websocket.Server({ port: P2P_PORT });
    server.on('connection', socket => this.connectSocket(socket));

    this.connectToPeers();
    setInterval(() => this.broadcastHeartbeat(), 2000);

    console.log(`Escuchando conexiones peer-to-peer en: ${P2P_PORT}`);
  }

  connectToPeers() {
    peers.forEach(peer => {
      const socket = new Websocket(peer);
      socket.on('open', () => this.connectSocket(socket));
      socket.on('open', () => {
        if (this.onPeerOpen) this.onPeerOpen(peer);
      });
      socket.on('error', () => {});
    });
  }

  connectSocket(socket) {
    this.sockets.push(socket);
    console.log('Socket conectado');

    this.messageHandler(socket);

    this.sendChain(socket);
    this.syncChains();
    if (this.onResyncRequest) this.onResyncRequest();
  }

  messageHandler(socket) {
    socket.on('message', message => {
      const data = JSON.parse(message);
      if (!p2pAuth.verifyEnvelope(data)) return;
      this.activeNodes.set(data.nodeId, Date.now());
      switch(data.type) {
        case MESSAGE_TYPES.chain:
          this.blockchain.replaceChain(data.payload.chain);
          break;
        case MESSAGE_TYPES.tx:
          if (this.onTxReceived) this.onTxReceived(data.payload.tx);
          break;
        case MESSAGE_TYPES.block:
          if (this.onBlockReceived) this.onBlockReceived(data.payload.block, data.nodeId);
          break;
        case MESSAGE_TYPES.ack:
          if (this.onAckReceived) this.onAckReceived(data.payload.blockHash, data.nodeId);
          break;
        case MESSAGE_TYPES.heartbeat:
          break;
        case MESSAGE_TYPES.propose:
          if (this.onProposeReceived) this.onProposeReceived(data.payload.block, data.nodeId);
          break;
        case MESSAGE_TYPES.vote:
          if (this.onVoteReceived) this.onVoteReceived(data.payload.blockHash, data.nodeId);
          break;
        case MESSAGE_TYPES.commit:
          if (this.onCommitReceived) this.onCommitReceived(data.payload.block, data.nodeId);
          break;
        case MESSAGE_TYPES.prevote:
          if (this.onPrevoteReceived) this.onPrevoteReceived(data.payload, data.nodeId);
          break;
        case MESSAGE_TYPES.precommit:
          if (this.onPrecommitReceived) this.onPrecommitReceived(data.payload, data.nodeId);
          break;
      }
    });
  }

  sendChain(socket) {
    socket.send(JSON.stringify(p2pAuth.createEnvelope(MESSAGE_TYPES.chain, { chain: this.blockchain.chain })));
  }

  syncChains() {
    this.sockets.forEach(socket => this.sendChain(socket));
  }

  broadcastTx(tx) {
    this.sockets.forEach((socket) => {
      socket.send(JSON.stringify({
        ...p2pAuth.createEnvelope(MESSAGE_TYPES.tx, { tx })
      }));
    });
  }

  broadcastBlock(block) { this.sockets.forEach((socket) => socket.send(JSON.stringify(p2pAuth.createEnvelope(MESSAGE_TYPES.block, { block })))); }
  sendAck(blockHash) { this.sockets.forEach((socket) => socket.send(JSON.stringify(p2pAuth.createEnvelope(MESSAGE_TYPES.ack, { blockHash })))); }
  broadcastHeartbeat() { this.sockets.forEach((socket) => socket.send(JSON.stringify(p2pAuth.createEnvelope(MESSAGE_TYPES.heartbeat, { ts: Date.now() })))); }
  broadcastPropose(block) { this.sockets.forEach((socket) => socket.send(JSON.stringify(p2pAuth.createEnvelope(MESSAGE_TYPES.propose, { block })))); }
  sendVote(blockHash) { this.sockets.forEach((socket) => socket.send(JSON.stringify(p2pAuth.createEnvelope(MESSAGE_TYPES.vote, { blockHash })))); }
  broadcastCommit(block) { this.sockets.forEach((socket) => socket.send(JSON.stringify(p2pAuth.createEnvelope(MESSAGE_TYPES.commit, { block })))); }
  broadcastPrevote(payload) { this.sockets.forEach((socket) => socket.send(JSON.stringify(p2pAuth.createEnvelope(MESSAGE_TYPES.prevote, payload)))); }
  broadcastPrecommit(payload) { this.sockets.forEach((socket) => socket.send(JSON.stringify(p2pAuth.createEnvelope(MESSAGE_TYPES.precommit, payload)))); }
  getActiveNodeIds(timeoutMs = 7000) {
    const now = Date.now();
    return Array.from(this.activeNodes.entries()).filter(([, ts]) => now - ts <= timeoutMs).map(([id]) => id);
  }

  setTxHandler(handler) {
    this.onTxReceived = handler;
  }
  setBlockHandler(handler) { this.onBlockReceived = handler; }
  setAckHandler(handler) { this.onAckReceived = handler; }
  setProposeHandler(handler) { this.onProposeReceived = handler; }
  setVoteHandler(handler) { this.onVoteReceived = handler; }
  setCommitHandler(handler) { this.onCommitReceived = handler; }
  setResyncHandler(handler) { this.onResyncRequest = handler; }
  setPeerOpenHandler(handler) { this.onPeerOpen = handler; }
  setPrevoteHandler(handler) { this.onPrevoteReceived = handler; }
  setPrecommitHandler(handler) { this.onPrecommitReceived = handler; }

}

module.exports = P2pServer;
