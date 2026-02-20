// api/products.js
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../server/data');

module.exports = (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const prodPath = path.join(dataDir, 'products.json');
    if (!fs.existsSync(prodPath)) return res.json({ products: [] });
    const raw = fs.readFileSync(prodPath, 'utf8');
    return res.json(JSON.parse(raw));
  } catch (err) {
    console.error('read products error', err);
    res.status(500).json({ error: 'Could not read products' });
  }
};
