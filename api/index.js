// api/index.js
// Optional: redirect to frontend or show API info
module.exports = (req, res) => {
  res.status(200).json({ message: 'AnyaBikini API root. See /api/products, /api/register, etc.' });
};
