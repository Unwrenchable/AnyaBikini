// api/sitemap.js
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../server/data');

module.exports = (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');
  try {
    const prodPath = path.join(dataDir, 'products.json');
    const products = fs.existsSync(prodPath) ? (JSON.parse(fs.readFileSync(prodPath, 'utf8')) || {}).products || [] : [];
    const siteUrl = (req.headers['x-forwarded-proto'] + '://' + req.headers.host).replace(/:\d+$/, '');
    const urls = [siteUrl + '/'];
    products.filter(p => p.published).forEach(p => {
      urls.push(siteUrl + '/product/' + encodeURIComponent(p.id));
    });
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` + urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n') + '\n</urlset>';
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('sitemap error', err);
    res.status(500).send('Server error');
  }
};
