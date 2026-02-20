// api/wishlist.js
const wishlistController = require('../server/controllers/advanced/wishlistController');

// Vercel serverless handler wrapper for Express-style controller
module.exports = (req, res) => {
  // Only allow GET, POST, DELETE, etc. as implemented in the controller
  return wishlistController(req, res);
};
