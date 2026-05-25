const blockchainService = require('../services/blockchain.service');
const mempoolService = require('../services/mempool.service');
const consensusService = require('../services/consensus.service');
const ConfigEnv = require('../config');
const fetch = require('node-fetch');
const consensusState = require('../services/consensus-state.service');
const pendingAcks = new Map();
const pendingProposals = new Map();
const proposalTimers = new Map();
const PROPOSAL_RETRY_MS = 3000;
const PROPOSAL_TTL_MS = 12000;
const isAllowedNode = (nodeId) => consensusService.getNodes().includes(nodeId);

const getBlocks = ({ blockchain, p2pServer }) => (req, res) => {
  p2pServer.syncChains();
  res.json(blockchain.chain);
};

const getBlockByCelhash = ({ blockchain }) => (req, res) => {
  const foundBlock = blockchainService.findBlockByCelhash(blockchain.chain, req.body.celhash);
  if (!foundBlock) return res.status(404).json({ mensaje: 'Hash no encontrado.' });
  return res.json(foundBlock);
};


const submitTx = ({ p2pServer }) => (req, res) => {
  const { tx, added } = mempoolService.addTx(req.body.data);
  if (added) p2pServer.broadcastTx(tx);
  res.status(202).json({ accepted: true, added, tx });
};

const mineFromMempool = ({ blockchain, p2pServer }) => (req, res) => {
  if (!consensusService.isCurrentLeader()) {
    return res.status(409).json({ mensaje: 'Este nodo no es líder del slot actual.' });
  }
  const tx = mempoolService.popOne();
  if (!tx) return res.status(204).send();
  const height = blockchain.chain.length;
  const round = consensusState.getRound();
  const consensusMeta = { ...consensusService.getCurrentConsensusMeta(height), round };
  const block = blockchainService.mineAndSync({ blockchain, p2pServer, data: tx, consensusMeta });
  const activeNodes = p2pServer.getActiveNodeIds();
  pendingAcks.set(block.hash, new Set([ConfigEnv.NODE_ID]));
  pendingProposals.set(block.hash, block);
  consensusState.setProposal(height, round, block);
  scheduleProposalRetry(block.hash, p2pServer);
  p2pServer.broadcastPropose(block);
  p2pServer.broadcastPrevote({ height, round, hash: block.hash });
  mempoolService.removeByCelhash(tx.celhash);
  return res.status(201).json({ block, activeNodes, quorum: consensusService.getDynamicQuorum(activeNodes.length) });
};
const scheduleProposalRetry = (blockHash, p2pServer) => {
  if (proposalTimers.has(blockHash)) clearTimeout(proposalTimers.get(blockHash));
  const timer = setTimeout(() => {
    const block = pendingProposals.get(blockHash);
    if (!block) return;
    p2pServer.broadcastPropose(block);
    scheduleProposalRetry(blockHash, p2pServer);
  }, PROPOSAL_RETRY_MS);
  proposalTimers.set(blockHash, timer);
};

const cleanupExpiredProposals = () => {
  const now = Date.now();
  for (const [hash, block] of pendingProposals.entries()) {
    const blockTs = new Date(block.timestamp).getTime();
    if (Number.isFinite(blockTs) && now - blockTs > PROPOSAL_TTL_MS) {
      pendingProposals.delete(hash);
      pendingAcks.delete(hash);
      if (proposalTimers.has(hash)) clearTimeout(proposalTimers.get(hash));
      proposalTimers.delete(hash);
    }
  }
};

const receiveBlockFromPeer = ({ blockchain, p2pServer }) => (block) => {
  const blockSlot = block?.consensus?.slot;
  const expectedLeader = consensusService.getLeaderForSlot(blockSlot);
  if (!expectedLeader) return;
  if (block?.consensus?.leaderId !== expectedLeader) return;
  if (block?.consensus?.height !== blockchain.chain.length) return;
  if (blockchain.chain.find((item) => item.hash === block.hash)) return;
  if (block.lastHash !== blockchain.chain[blockchain.chain.length - 1].hash) return;
  blockchain.chain.push(block);
  blockchain.saveBlock(block);
  p2pServer.sendAck(block.hash);
};

const receiveAckFromPeer = () => (blockHash, nodeId) => {
  if (!isAllowedNode(nodeId)) return;
  if (!pendingAcks.has(blockHash)) pendingAcks.set(blockHash, new Set());
  pendingAcks.get(blockHash).add(nodeId);
};

const receiveProposeFromPeer = ({ blockchain, p2pServer }) => (block, nodeId) => {
  if (!isAllowedNode(nodeId)) return;
  const blockSlot = block?.consensus?.slot;
  const expectedLeader = consensusService.getLeaderForSlot(blockSlot);
  if (block?.consensus?.leaderId !== expectedLeader) return;
  if (block?.consensus?.height !== blockchain.chain.length) return;
  if (block.lastHash !== blockchain.chain[blockchain.chain.length - 1].hash) return;
  pendingProposals.set(block.hash, block);
  consensusState.setProposal(block.consensus.height, block.consensus.round || 0, block);
  p2pServer.broadcastPrevote({ height: block.consensus.height, round: block.consensus.round || 0, hash: block.hash });
  p2pServer.sendVote(block.hash);
};

const receivePrevoteFromPeer = ({ p2pServer }) => (payload, nodeId) => {
  if (!isAllowedNode(nodeId)) return;
  const count = consensusState.addPrevote(payload.height, payload.round, payload.hash, nodeId);
  const quorum = consensusService.getDynamicQuorum(p2pServer.getActiveNodeIds().length);
  if (count >= quorum) p2pServer.broadcastPrecommit(payload);
};

const receivePrecommitFromPeer = ({ p2pServer }) => (payload, nodeId) => {
  if (!isAllowedNode(nodeId)) return;
  const count = consensusState.addPrecommit(payload.height, payload.round, payload.hash, nodeId);
  const quorum = consensusService.getDynamicQuorum(p2pServer.getActiveNodeIds().length);
  if (count >= quorum) {
    const block = pendingProposals.get(payload.hash) || consensusState.getProposal(payload.height, payload.round);
    if (block) p2pServer.broadcastCommit(block);
  }
};

const receiveVoteFromPeer = ({ p2pServer }) => (blockHash, nodeId) => {
  if (!isAllowedNode(nodeId) || !pendingProposals.has(blockHash)) return;
  if (!pendingAcks.has(blockHash)) pendingAcks.set(blockHash, new Set([ConfigEnv.NODE_ID]));
  pendingAcks.get(blockHash).add(nodeId);
  const activeNodes = p2pServer.getActiveNodeIds();
  const quorum = consensusService.getDynamicQuorum(activeNodes.length);
  if (pendingAcks.get(blockHash).size >= quorum) {
    const block = pendingProposals.get(blockHash);
    p2pServer.broadcastCommit(block);
    if (proposalTimers.has(blockHash)) clearTimeout(proposalTimers.get(blockHash));
    proposalTimers.delete(blockHash);
    pendingProposals.delete(blockHash);
  }
};

const receiveCommitFromPeer = ({ blockchain }) => (block) => {
  if (blockchain.chain.find((item) => item.hash === block.hash)) return;
  if (block?.consensus?.height !== blockchain.chain.length) return;
  if (block.lastHash !== blockchain.chain[blockchain.chain.length - 1].hash) return;
  blockchain.chain.push(block);
  blockchain.saveBlock(block);
  pendingProposals.delete(block.hash);
  if (proposalTimers.has(block.hash)) clearTimeout(proposalTimers.get(block.hash));
  proposalTimers.delete(block.hash);
};

const resyncOnReconnect = ({ p2pServer }) => () => {
  p2pServer.syncChains();
};

const syncFromPeerByHeight = ({ blockchain }) => async (peerUrl) => {
  try {
    const baseUrl = peerUrl.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:').replace(/:\d+$/, ':3001');
    const auth = { usuario: ConfigEnv.USER_API, contrasena: ConfigEnv.PASS_API };
    const heightResponse = await fetch(`${baseUrl}/height`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auth)
    });
    if (!heightResponse.ok) return;
    const { height: peerHeight } = await heightResponse.json();
    const myHeight = blockchain.getHeight();
    if (peerHeight <= myHeight) return;
    const blocksResponse = await fetch(`${baseUrl}/blocks-from`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...auth, fromHeight: myHeight })
    });
    if (!blocksResponse.ok) return;
    const { blocks } = await blocksResponse.json();
    if (!Array.isArray(blocks)) return;
    for (const block of blocks) {
      if (blockchain.chain.find((item) => item.hash === block.hash)) continue;
      if (block.consensus?.height !== blockchain.chain.length) break;
      if (block.lastHash !== blockchain.chain[blockchain.chain.length - 1].hash) break;
      blockchain.chain.push(block);
      await blockchain.saveBlock(block);
    }
  } catch (_) {}
};

const getHeight = ({ blockchain }) => (req, res) => {
  res.json({ height: blockchain.getHeight() });
};

const getBlocksFrom = ({ blockchain }) => (req, res) => {
  const from = Number(req.body.fromHeight || 0);
  res.json({ blocks: blockchain.getBlocksFromHeight(from) });
};

const getAckStatus = () => (req, res) => {
  cleanupExpiredProposals();
  const status = {};
  for (const [blockHash, voters] of pendingAcks.entries()) {
    const active = req.activeNodesCount || consensusService.getNodes().length;
    const quorum = consensusService.getDynamicQuorum(active);
    status[blockHash] = { acks: voters.size, quorum, finalized: voters.size >= quorum };
  }
  res.json(status);
};

module.exports = {
  getBlocks,
  getBlockByCelhash,
  submitTx,
  mineFromMempool
  ,
  receiveBlockFromPeer,
  receiveAckFromPeer,
  getAckStatus,
  receiveProposeFromPeer,
  receiveVoteFromPeer,
  receiveCommitFromPeer,
  resyncOnReconnect,
  getHeight,
  getBlocksFrom
  ,
  syncFromPeerByHeight
  ,
  receivePrevoteFromPeer,
  receivePrecommitFromPeer
};
