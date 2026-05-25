const { pool } = require('./database');

const mapRowToBlock = (row) => ({
  hash: row.hash,
  lastHash: row.last_hash,
  timestamp: row.timestamp,
  data: row.data,
  difficulty: row.difficulty,
  consensus: row.consensus
});

const findAll = async () => {
  const result = await pool.query('SELECT hash, last_hash, timestamp, data, difficulty, consensus FROM blocks ORDER BY id ASC');
  return result.rows.map(mapRowToBlock);
};

const findByHashes = async (lastHash, hash) => {
  const result = await pool.query(
    'SELECT hash FROM blocks WHERE last_hash = $1 AND hash = $2 LIMIT 1',
    [lastHash, hash]
  );
  return result.rows[0] || null;
};

const findByCelhash = async (celhash) => {
  const result = await pool.query(
    "SELECT hash FROM blocks WHERE data->0->>'celhash' = $1 LIMIT 1",
    [celhash]
  );
  return result.rows[0] || null;
};

const insert = async ({ hash, lastHash, timestamp, data, difficulty, consensus }) => {
  await pool.query(
    'INSERT INTO blocks (hash, last_hash, timestamp, data, difficulty, consensus) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (hash) DO NOTHING',
    [hash, lastHash, timestamp, JSON.stringify(data), difficulty, JSON.stringify(consensus || {})]
  );
};

module.exports = {
  findAll,
  findByHashes,
  findByCelhash,
  insert
};
