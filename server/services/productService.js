// Product service: handles product CRUD and catalog logic
const fs = require('fs');
const path = require('path');

const DB_JSON = process.env.DATABASE_PATH || './data/db.json';
const dataDir = path.dirname(DB_JSON);

function getProducts() {
  try {
    const prodPath = path.join(dataDir, 'products.json');
    if (!fs.existsSync(prodPath)) return [];
    const raw = fs.readFileSync(prodPath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed.products || [];
  } catch (err) {
    console.error('read products error', err);
    return [];
  }
}

function saveProducts(products) {
  const prodPath = path.join(dataDir, 'products.json');
  fs.writeFileSync(prodPath, JSON.stringify({ products }, null, 2));
}

module.exports = {
  getProducts,
  saveProducts,
};
