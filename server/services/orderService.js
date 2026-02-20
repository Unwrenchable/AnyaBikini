// Order service: handles order CRUD and logic
const fs = require('fs');
const path = require('path');
const os = require('os');

function getDbPath() {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  return path.join(__dirname, '..', 'data', 'db.json');
}

function readDb() {
  const DB_JSON = getDbPath();
  try {
    if (!fs.existsSync(DB_JSON)) {
      const dataDir = path.dirname(DB_JSON);
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const initial = { users: [], orders: [], nextUserId: 1, nextOrderId: 1 };
      fs.writeFileSync(DB_JSON, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(DB_JSON, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('readDb error', err);
    return { users: [], orders: [], nextUserId: 1, nextOrderId: 1 };
  }
}

function writeDb(dbObj) {
  let DB_JSON = getDbPath();
  try {
    const dataDir = path.dirname(DB_JSON);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(DB_JSON, JSON.stringify(dbObj, null, 2));
  } catch (err) {
    console.error('writeDb error', err);
    if (!process.env.DATABASE_PATH) {
      try {
        const tmpPath = path.join(os.tmpdir(), 'anyabikini-db.json');
        fs.writeFileSync(tmpPath, JSON.stringify(dbObj, null, 2));
        console.warn(`orderService writeDb: switched to temp db at ${tmpPath}`);
        process.env.DATABASE_PATH = tmpPath;
      } catch (e2) {
        console.error('orderService writeDb fallback failed', e2);
      }
    }
  }
}

function createOrder({ user_id, items, amount_cents }) {
  const db = readDb();
  const id = db.nextOrderId++;
  const order = { id, user_id, items, amount_cents: amount_cents || 0, currency: 'usd', status: 'created', created_at: new Date().toISOString() };
  db.orders.push(order);
  writeDb(db);
  return order;
}

function getOrders() {
  const db = readDb();
  return db.orders || [];
}

module.exports = {
  createOrder,
  getOrders,
};
