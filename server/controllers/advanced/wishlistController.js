// Wishlist controller: API endpoints for wishlist
const express = require('express');
const router = express.Router();
const wishlistService = require('../../services/advanced/wishlistService');

// Middleware: require authentication (assumes req.user is set)
function requireAuth(req, res, next) {
  if (!req.user || !req.user.id) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// Get wishlist for current user
router.get('/', requireAuth, (req, res) => {
  const wishlist = wishlistService.getWishlist(req.user.id);
  res.json({ wishlist });
});

// Add product to wishlist
router.post('/add', requireAuth, (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'Missing productId' });
  wishlistService.addItem(req.user.id, productId);
  res.json({ ok: true });
});

// Remove product from wishlist
router.post('/remove', requireAuth, (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'Missing productId' });
  wishlistService.removeItem(req.user.id, productId);
  res.json({ ok: true });
});

// Clear wishlist
router.post('/clear', requireAuth, (req, res) => {
  wishlistService.clearWishlist(req.user.id);
  res.json({ ok: true });
});

module.exports = router;
