// Order service: handles order CRUD and logic
const fs = require('fs');
const DB_JSON = process.env.DATABASE_PATH || './data/db.json';

function readDb() {
  try {
    if (!fs.existsSync(DB_JSON)) {
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
  fs.writeFileSync(DB_JSON, JSON.stringify(dbObj, null, 2));
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
