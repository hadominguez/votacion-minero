const ConfigEnv = require('../config');

const getNodes = () => ConfigEnv.NODE_LIST.split(',').map((item) => item.trim()).filter(Boolean);

const getSlot = (timestampMs = Date.now()) => Math.floor(timestampMs / (ConfigEnv.SLOT_SECONDS * 1000));

const getLeaderForSlot = (slot) => {
  const nodes = getNodes();
  if (!nodes.length) return null;
  return nodes[slot % nodes.length];
};

const isCurrentLeader = () => {
  const slot = getSlot();
  return getLeaderForSlot(slot) === ConfigEnv.NODE_ID;
};

const getCurrentConsensusMeta = (height) => {
  const slot = getSlot();
  return { slot, leaderId: getLeaderForSlot(slot), height };
};

const getDynamicQuorum = (activeNodeCount) => Math.floor(activeNodeCount / 2) + 1;

module.exports = {
  getNodes,
  getSlot,
  getLeaderForSlot,
  isCurrentLeader,
  getCurrentConsensusMeta,
  getDynamicQuorum
};
