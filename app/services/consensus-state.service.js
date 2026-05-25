const state = {
  height: 0,
  round: 0,
  proposals: new Map(),
  prevotes: new Map(),
  precommits: new Map()
};

const key = (height, round, hash) => `${height}:${round}:${hash}`;

const setHeight = (height) => { state.height = height; };
const getHeight = () => state.height;
const getRound = () => state.round;
const nextRound = () => { state.round += 1; return state.round; };

const setProposal = (height, round, block) => state.proposals.set(`${height}:${round}`, block);
const getProposal = (height, round) => state.proposals.get(`${height}:${round}`);

const addPrevote = (height, round, hash, nodeId) => {
  const k = key(height, round, hash);
  if (!state.prevotes.has(k)) state.prevotes.set(k, new Set());
  state.prevotes.get(k).add(nodeId);
  return state.prevotes.get(k).size;
};

const addPrecommit = (height, round, hash, nodeId) => {
  const k = key(height, round, hash);
  if (!state.precommits.has(k)) state.precommits.set(k, new Set());
  state.precommits.get(k).add(nodeId);
  return state.precommits.get(k).size;
};

module.exports = {
  setHeight, getHeight, getRound, nextRound,
  setProposal, getProposal, addPrevote, addPrecommit
};
