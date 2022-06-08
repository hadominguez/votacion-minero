const Websocket = require('ws');
const ConfigEnv = require('./config');

const P2P_PORT = ConfigEnv.P2P_PORT || 5000;

//const P2P_PORT = process.env.P2P_PORT || 5001;
const peers = ConfigEnv.PEERS ? ConfigEnv.PEERS.split(',') : [];
const MESSAGE_TYPES = {
  chain: 'CHAIN' 
};

class P2pServer {
  constructor(blockchain ) {
    this.blockchain = blockchain;
    this.sockets = [];
  }

  listen() {
    const server = new Websocket.Server({ port: P2P_PORT });
    server.on('connection', socket => this.connectSocket(socket));

    this.connectToPeers();

    console.log(`Escuchando conexiones peer-to-peer en: ${P2P_PORT}`);
  }

  connectToPeers() {
    peers.forEach(peer => {
      const socket = new Websocket(peer);

      socket.on('open', () => this.connectSocket(socket));
    });
  }

  connectSocket(socket) {
    this.sockets.push(socket);
    console.log('Socket conectado');

    this.messageHandler(socket);

    this.sendChain(socket);
    this.syncChains();
  }

  messageHandler(socket) {
    socket.on('message', message => {
      const data = JSON.parse(message);
      switch(data.type) {
        case MESSAGE_TYPES.chain:
          this.blockchain.replaceChain(data.chain);
          break;
      }
    });
  }

  sendChain(socket) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.chain,
      chain: this.blockchain.chain
    }));
  }

  syncChains() {
    this.sockets.forEach(socket => this.sendChain(socket));
  }

}

module.exports = P2pServer;