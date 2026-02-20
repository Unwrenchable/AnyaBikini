
// Wishlist service: persistent storage in DB JSON
const fs = require('fs');
const DB_JSON = process.env.DATABASE_PATH || './data/db.json';

function readDb() {
  try {
    if (!fs.existsSync(DB_JSON)) {
      const initial = { users: [], orders: [], nextUserId: 1, nextOrderId: 1, wishlists: {} };
      fs.writeFileSync(DB_JSON, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(DB_JSON, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('readDb error', err);
    return { users: [], orders: [], nextUserId: 1, nextOrderId: 1, wishlists: {} };
  }
}

function writeDb(dbObj) {
  fs.writeFileSync(DB_JSON, JSON.stringify(dbObj, null, 2));
}

function getWishlist(userId) {
  const db = readDb();
  return (db.wishlists && db.wishlists[userId]) ? db.wishlists[userId] : [];
}

function addItem(userId, productId) {
  const db = readDb();
  if (!db.wishlists) db.wishlists = {};
  if (!db.wishlists[userId]) db.wishlists[userId] = [];
  if (!db.wishlists[userId].includes(productId)) db.wishlists[userId].push(productId);
  writeDb(db);
}

function removeItem(userId, productId) {
  const db = readDb();
  if (!db.wishlists || !db.wishlists[userId]) return;
  db.wishlists[userId] = db.wishlists[userId].filter(pid => pid !== productId);
  writeDb(db);
}

function clearWishlist(userId) {
  const db = readDb();
  if (db.wishlists) db.wishlists[userId] = [];
  writeDb(db);
}

module.exports = {
  getWishlist,
  addItem,
  removeItem,
  clearWishlist,
};
