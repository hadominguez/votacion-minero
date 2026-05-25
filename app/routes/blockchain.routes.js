const express = require('express');
const checkAuth = require('../middlewares/auth');
const validateBody = require('../middlewares/validate-body');
const { authSchema, blockSchema, txSchema } = require('../validators/blockchain');
const blockchainController = require('../controllers/blockchain.controller');

const createBlockchainRouter = ({ blockchain, p2pServer }) => {
  const router = express.Router();
  const getBlocks = blockchainController.getBlocks({ blockchain, p2pServer });
  const getBlockByCelhash = blockchainController.getBlockByCelhash({ blockchain });
  const submitTx = blockchainController.submitTx({ p2pServer });
  const mineFromMempool = blockchainController.mineFromMempool({ blockchain, p2pServer });
  const getAckStatus = blockchainController.getAckStatus();
  const getHeight = blockchainController.getHeight({ blockchain });
  const getBlocksFrom = blockchainController.getBlocksFrom({ blockchain });

  router.post('/blocks', validateBody(authSchema), checkAuth, getBlocks);

  router.post('/block', validateBody(blockSchema), checkAuth, getBlockByCelhash);

  router.post('/tx', validateBody(txSchema), checkAuth, submitTx);
  router.post('/mine-slot', validateBody(authSchema), checkAuth, mineFromMempool);
  router.post('/acks', validateBody(authSchema), checkAuth, getAckStatus);
  router.post('/height', validateBody(authSchema), checkAuth, getHeight);
  router.post('/blocks-from', validateBody(authSchema), checkAuth, getBlocksFrom);

  return router;
};

module.exports = createBlockchainRouter;
