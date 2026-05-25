const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const createBlockchainRouter = require('./routes/blockchain.routes');
const errorHandler = require('./middlewares/error-handler');

const createApp = ({ blockchain, p2pServer }) => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(morgan('combined'));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(express.json({ limit: '10kb' }));
  app.use(rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false }));
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
  app.use(createBlockchainRouter({ blockchain, p2pServer }));
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
