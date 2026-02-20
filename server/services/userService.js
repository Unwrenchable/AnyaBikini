// User service: handles user CRUD and authentication logic
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Use absolute path based on the server directory so the DB lives
// in `/server/data/db.json` regardless of where the process is started.
// compute database path dynamically so we can fall back if the
// default location becomes unwritable (serverless environments like
// Vercel have a read-only project root). When DATABASE_PATH is provided
// via env it takes precedence; otherwise we use `server/data/db.json`.
// On write failures we’ll switch to os.tmpdir().
const os = require('os');

function getDbPath() {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }
  // default location relative to server folder
  return path.join(__dirname, '..', 'data', 'db.json');
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function readDb() {
  const DB_JSON = getDbPath();
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
  let DB_JSON = getDbPath();
  const dataDir = path.dirname(DB_JSON);
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_JSON, JSON.stringify(dbObj, null, 2));
  } catch (err) {
    console.error('writeDb error', err);
    // if the error occurred because the default location is read-only,
    // fall back to a temporary file and update the env var so subsequent
    // reads/writes use the tmp path.
    if (!process.env.DATABASE_PATH) {
      try {
        const tmpPath = path.join(os.tmpdir(), 'anyabikini-db.json');
        fs.writeFileSync(tmpPath, JSON.stringify(dbObj, null, 2));
        console.warn(`writeDb: switched to temp db at ${tmpPath}`);
        process.env.DATABASE_PATH = tmpPath;
      } catch (e2) {
        console.error('writeDb fallback to tmp failed', e2);
      }
    }
  }
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
