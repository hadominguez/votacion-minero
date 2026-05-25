require('dotenv').config();

const DIFFICULTY = Number(process.env.DIFFICULTY || 1);
const USER_API = process.env.USER_API || 'tesisfinal';
const PASS_API = process.env.PASS_API || 't3s15f1n47';
const USERDB = process.env.USERDB || 'useradmin';
const PASSDB = process.env.PASSDB || 'p4ssw0rd2022';
const NAMEDB = process.env.NAMEDB || 'blockchain';
const HOSTDB = process.env.HOSTDB || 'localhost';
const PORTDB = process.env.PORTDB || '27017';
const HTTP_PORT = Number(process.env.HTTP_PORT || 3001);
const P2P_PORT = Number(process.env.P2P_PORT || 5001);
const PEERS = process.env.PEERS || '';
const NODE_ID = process.env.NODE_ID || 'node-1';
const NODE_LIST = process.env.NODE_LIST || 'node-1';
const SLOT_SECONDS = Number(process.env.SLOT_SECONDS || 5);
const NODE_SECRET = process.env.NODE_SECRET || 'change_me_secret';
const QUORUM_MIN = Number(process.env.QUORUM_MIN || 2);

module.exports = {
  DIFFICULTY,
  USER_API,
  PASS_API,
  USERDB,
  PASSDB,
  NAMEDB,
  HOSTDB,
  PORTDB,
  HTTP_PORT,
  P2P_PORT,
  PEERS,
  NODE_ID,
  NODE_LIST,
  SLOT_SECONDS
  ,
  NODE_SECRET,
  QUORUM_MIN
};

