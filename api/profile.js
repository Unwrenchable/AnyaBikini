// api/profile.js
const { findUserById } = require('../server/services/userService');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req) {
  const cookie = req.headers.cookie || '';
  const token = (cookie.match(/token=([^;]+)/) || [])[1] || (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const userPayload = authMiddleware(req);
  if (!userPayload) return res.status(401).json({ error: 'Unauthorized' });
  const row = findUserById(userPayload.id);
  if (!row) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { id: row.id, email: row.email, name: row.name, created_at: row.created_at } });
};
