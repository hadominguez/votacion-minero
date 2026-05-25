const pool = new Map();

const addTx = (data) => {
  const key = data.celhash;
  const exists = pool.has(key);
  if (!exists) pool.set(key, data);
  return { tx: pool.get(key), added: !exists };
};

const getAll = () => Array.from(pool.values());

const popOne = () => {
  const first = pool.keys().next();
  if (first.done) return null;
  const value = pool.get(first.value);
  pool.delete(first.value);
  return value;
};

const removeByCelhash = (celhash) => pool.delete(celhash);

module.exports = { addTx, getAll, popOne, removeByCelhash };
