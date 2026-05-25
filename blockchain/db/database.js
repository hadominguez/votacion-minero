const { Pool } = require('pg');
const ConfigEnv = require('../../app/config');

const pool = new Pool({
  host: ConfigEnv.HOSTDB,
  database: ConfigEnv.NAMEDB,
  user: ConfigEnv.USERDB,
  password: ConfigEnv.PASSDB,
  port: Number(ConfigEnv.PORTDB)
});

const initDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blocks (
      id BIGSERIAL PRIMARY KEY,
      hash TEXT NOT NULL UNIQUE,
      last_hash TEXT NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL,
      data JSONB NOT NULL,
      difficulty INTEGER NOT NULL,
      consensus JSONB NOT NULL DEFAULT '{}'::jsonb
    );
  `);
  await pool.query(`ALTER TABLE blocks ADD COLUMN IF NOT EXISTS consensus JSONB NOT NULL DEFAULT '{}'::jsonb;`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS ux_blocks_celhash ON blocks ((data->0->>'celhash')) WHERE (data->0->>'celhash') IS NOT NULL;`);
};

module.exports = {
  pool,
  initDatabase
};
