const crypto = require('crypto');
const ConfigEnv = require('../config');
const consensusService = require('./consensus.service');

const signPayload = (payload) => crypto.createHmac('sha256', ConfigEnv.NODE_SECRET).update(payload).digest('hex');

const isAllowedNode = (nodeId) => consensusService.getNodes().includes(nodeId);

const createEnvelope = (type, payload) => {
  const body = JSON.stringify(payload);
  return { type, payload, nodeId: ConfigEnv.NODE_ID, sig: signPayload(`${type}|${body}|${ConfigEnv.NODE_ID}`) };
};

const verifyEnvelope = (message) => {
  if (!message || !message.type || !message.payload || !message.nodeId || !message.sig) return false;
  if (!isAllowedNode(message.nodeId)) return false;
  const body = JSON.stringify(message.payload);
  const expected = signPayload(`${message.type}|${body}|${message.nodeId}`);
  return expected === message.sig;
};

module.exports = { createEnvelope, verifyEnvelope };
