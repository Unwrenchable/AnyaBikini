// User service: handles user CRUD and authentication logic
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Use absolute path based on the server directory so the DB lives
// in `/server/data/db.json` regardless of where the process is started.
const DB_JSON = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function readDb() {
  try {
    if (!fs.existsSync(DB_JSON)) {
      const dataDir = path.dirname(DB_JSON);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
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
  const dataDir = path.dirname(DB_JSON);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(DB_JSON, JSON.stringify(dbObj, null, 2));
}

async function findUserByEmail(email) {
  const db = readDb();
  return db.users.find(u => u.email === email);
}

async function findUserById(id) {
  const db = readDb();
  return db.users.find(u => u.id === id);
}

async function createUser({ email, passwordHash, name }) {
  const db = readDb();
  if (db.users.find(u => u.email === email)) throw new Error('exists');
  const id = db.nextUserId++;
  const user = { id, email, password: passwordHash, name: name || null, created_at: new Date().toISOString() };
  db.users.push(user);
  writeDb(db);
  return user;
}

async function updateUser(user) {
  const db = readDb();
  const idx = db.users.findIndex(u => u.id === user.id);
  if (idx === -1) return false;
  db.users[idx] = user;
  writeDb(db);
  return true;
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

module.exports = {
  readDb,
  writeDb,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  signToken,
};
