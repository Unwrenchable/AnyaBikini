// api/wishlist.js
const express = require('express');
const jwt = require('jsonwebtoken');
const wishlistController = require('../server/controllers/advanced/wishlistController');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

const app = express();
app.use(express.json());

// Auth middleware: populate req.user from cookie or Authorization header
app.use((req, res, next) => {
  const cookie = req.headers.cookie || '';
  const token = (cookie.match(/token=([^;]+)/) || [])[1] ||
    (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

app.use('/', wishlistController);

// Vercel serverless handler
module.exports = (req, res) => app(req, res);
