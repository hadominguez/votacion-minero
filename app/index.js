const express = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('../blockchain/blockchain');
const P2pServer = require('./p2p-server');
const Miner = require('./miner');
const ConfigEnv = require('./config');
const HTTP_PORT = ConfigEnv.HTTP_PORT || 3000;

const app = express();
const bc = new Blockchain();
bc.cargaChain(bc);
const p2pServer = new P2pServer(bc);
const miner = new Miner(bc, p2pServer);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const routerControl = express.Router();
routerControl.use((req, res, next) => {

  if (req.body.usuario === ConfigEnv.USER_API && req.body.contrasena === ConfigEnv.PASS_API) {
    next();
  } else {
    res.send({ 
        mensaje: 'Usuario o contraseña invalido.'
    });
  }
});


app.post('/blocks', routerControl, (req, res) => {
  p2pServer.syncChains();
  res.json(bc.chain);
});

app.post('/block', routerControl, (req, res) => {
  if (req.body.celhash) {
    let hash_existe = false;
    var block ;
    for (let i=1; i<bc.chain.length; i++) {
      var blocke = bc.chain[i];
      if (blocke.data[0].celhash === req.body.celhash) {
        hash_existe = true;
        block = blocke;
      }
    }
    if (hash_existe === true) {
      res.json(block);
    }else{
      res.send({ 
          mensaje: 'Hash no encontrado.'
      });
    }
  } else {
    res.send({ 
        mensaje: 'Hash no enviado.'
    });
  }
});

app.post('/mine', routerControl, (req, res) => {
  p2pServer.syncChains();
  const block = bc.addBlock(req.body.data);
  p2pServer.syncChains();
  console.log(`Nuevo bloque agregado: ${block.toString()}`); 
  res.json(block);
});

app.listen(HTTP_PORT, () => console.log(`Escuchando en el puerto ${HTTP_PORT}`));
p2pServer.listen();
