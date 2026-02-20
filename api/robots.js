// api/robots.js
module.exports = (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');
  const siteUrl = (req.headers['x-forwarded-proto'] + '://' + req.headers.host).replace(/:\d+$/, '');
  res.setHeader('Content-Type', 'text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: ${siteUrl}/api/sitemap`);
};
