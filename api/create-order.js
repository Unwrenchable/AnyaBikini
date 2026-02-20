// api/create-order.js
const { createOrder } = require('../server/services/orderService');
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const userPayload = authMiddleware(req);
  if (!userPayload) return res.status(401).json({ error: 'Unauthorized' });
  const { items, amount_cents } = req.body;
  if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Invalid items' });
  try {
    const order = createOrder({ user_id: userPayload.id, items, amount_cents });
    res.json({ ok: true, orderId: order.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create order' });
  }
};
