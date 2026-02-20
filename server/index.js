const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const axios = require('axios');

dotenv.config();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const DB_JSON = process.env.DATABASE_PATH || './data/db.json';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
let stripe = null;
if (STRIPE_SECRET_KEY) {
  stripe = require('stripe')(STRIPE_SECRET_KEY);
}

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dataDir = path.dirname(DB_JSON);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function readDb() {
  try {
    if (!fs.existsSync(DB_JSON)) {
      const initial = { users: [], orders: [], nextUserId: 1, nextOrderId: 1 };
      fs.writeFileSync(DB_JSON, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(DB_JSON, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('readDb error', err);
    return { users: [], orders: [], nextUserId: 1, nextOrderId: 1 };
  }
}

function writeDb(dbObj) {
  fs.writeFileSync(DB_JSON, JSON.stringify(dbObj, null, 2));
}

function updateUser(user) {
  const db = readDb();
  const idx = db.users.findIndex(u => u.id === user.id);
  if (idx === -1) return false;
  db.users[idx] = user;
  writeDb(db);
  return true;
}

// Simple email sender - uses SMTP env vars if provided, otherwise logs the message
async function sendEmail({ to, subject, text, html }) {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transporter.sendMail({ from: process.env.FROM_EMAIL || process.env.SMTP_USER, to, subject, text, html });
  } else {
    console.log('--- email (dev) ---');
    console.log('to:', to);
    console.log('subject:', subject);
    console.log('text:', text);
    if (html) console.log('html:', html);
    console.log('--- end email ---');
  }
}

function findUserByEmail(email) {
  const db = readDb();
  return db.users.find(u => u.email === email);
}

function findUserById(id) {
  const db = readDb();
  return db.users.find(u => u.id === id);
}

function createUser({ email, passwordHash, name }) {
  const db = readDb();
  if (db.users.find(u => u.email === email)) throw new Error('exists');
  const id = db.nextUserId++;
  const user = { id, email, password: passwordHash, name: name || null, created_at: new Date().toISOString() };
  db.users.push(user);
  writeDb(db);
  return user;
}

function createOrder({ user_id, items, amount_cents }) {
  const db = readDb();
  const id = db.nextOrderId++;
  const order = { id, user_id, items, amount_cents: amount_cents || 0, currency: 'usd', status: 'created', created_at: new Date().toISOString() };
  db.orders.push(order);
  writeDb(db);
  return order;
}

function findOrderById(id) {
  const db = readDb();
  return db.orders.find(o => o.id === id);
}

function updateOrder(order) {
  const db = readDb();
  const idx = db.orders.findIndex(o => o.id === order.id);
  if (idx === -1) return false;
  db.orders[idx] = order;
  writeDb(db);
  return true;
}

const app = express();

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Content Security Policy - no eval or unsafe-inline, allow Stripe and external resources
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https: http:; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://api.stripe.com; " +
    "frame-src https://js.stripe.com; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
  );
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// Advanced feature: Wishlist API
const wishlistController = require('./controllers/advanced/wishlistController');
app.use('/api/wishlist', authMiddleware, wishlistController);

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

function authMiddleware(req, res, next) {
  const token = (req.cookies && req.cookies.token) || (req.headers.authorization && req.headers.authorization.replace('Bearer ', ''));
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Register
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // Email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Password strength validation
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = createUser({ email, passwordHash: hashed, name });
    // create email verification token and send verification email
    try {
      const verifyToken = crypto.randomBytes(20).toString('hex');
      user.verifyToken = verifyToken;
      user.verifyExpires = Date.now() + 1000 * 60 * 60 * 24; // 24h
      updateUser(user);
      const origin = req.headers.origin || (req.protocol + '://' + req.get('host'));
      const verifyUrl = `${origin}/verify.html?token=${verifyToken}`;
      await sendEmail({ to: user.email, subject: 'Verify your AnyaBikini account', text: `Verify: ${verifyUrl}`, html: `<p>Click to verify your account: <a href="${verifyUrl}">${verifyUrl}</a></p>` });
    } catch (e) {
      console.warn('verify email send failed', e && e.message);
    }
    const token = signToken({ id: user.id, email });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 2592000000 });
    res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    if (err.message === 'exists') return res.status(400).json({ error: 'Email already exists' });
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const user = findUserByEmail(email);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    const token = signToken({ id: user.id, email: user.email });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 2592000000 });
    res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

app.get('/api/profile', authMiddleware, (req, res) => {
  const row = findUserById(req.user.id);
  if (!row) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { id: row.id, email: row.email, name: row.name, created_at: row.created_at } });
});

// Instagram images proxy
app.get('/api/instagram', async (req, res) => {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  if (!token || !userId) return res.status(400).json({ error: 'Instagram access not configured' });
  try {
    const url = `https://graph.instagram.com/${userId}/media?fields=id,caption,media_url,permalink,thumbnail_url,media_type&access_token=${token}`;
    const resp = await axios.get(url);
    const data = resp.data && resp.data.data ? resp.data.data : [];
    res.json({ data });
  } catch (err) {
    console.error('Instagram fetch error', err.message || err);
    res.status(500).json({ error: 'Failed to fetch Instagram' });
  }
});

// Products API (read-only)
app.get('/api/products', (req, res) => {
  try {
    const prodPath = path.join(dataDir, 'products.json');
    if (!fs.existsSync(prodPath)) return res.json({ products: [] });
    const raw = fs.readFileSync(prodPath, 'utf8');
    return res.json(JSON.parse(raw));
  } catch (err) {
    console.error('read products error', err);
    res.status(500).json({ error: 'Could not read products' });
  }
});

// Admin: sync instagram media -> products.json
app.post('/api/admin/sync-instagram', adminAuth, async (req, res) => {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  if (!token || !userId) return res.status(400).json({ error: 'Instagram not configured' });
  try {
    // fetch media list
    const url = `https://graph.instagram.com/${userId}/media?fields=id,caption,media_url,permalink,thumbnail_url,media_type&access_token=${token}`;
    const resp = await axios.get(url);
    const media = resp.data && resp.data.data ? resp.data.data : [];

    // filter to images only (professional shots are typically images)
    const images = media.filter(m => (m.media_type || '').toUpperCase() === 'IMAGE');
    // map to product entries (best-effort)
    const products = images.map(m => {
      const caption = (m.caption || '').trim();
      // heuristics: first line as title, price if found like $99 or 99
      let title = caption.split('\n')[0] || `Instagram ${m.id}`;
      let description = caption;
      let price = 0;
      const priceMatch = caption.match(/\$\s*([0-9]+(?:\.[0-9]{1,2})?)/) || caption.match(/([0-9]{2,4})\s*(USD|usd)?/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1]);
      }
      const image = m.media_url || m.thumbnail_url || null;
      return {
        id: `ig_${m.id}`,
        sku: `ig_${m.id}`,
        name: title,
        description,
        price: price,
        published: true,
        image,
        permalink: m.permalink || null,
        source: 'instagram',
        raw: m
      };
    });

    const prodPath = path.join(dataDir, 'products.json');
    fs.writeFileSync(prodPath, JSON.stringify({ products }, null, 2));
    res.json({ ok: true, count: products.length, products });
  } catch (err) {
    console.error('sync instagram error', err.message || err);
    res.status(500).json({ error: 'Could not sync Instagram' });
  }
});

// Public config endpoint (client can read publishable keys)
app.get('/api/config', (req, res) => {
  res.json({
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    instagramConfigured: !!(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_USER_ID)
  });
});

// Admin token check (simple header-based protection)
function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.admin_token;
  if (!token || token !== process.env.ADMIN_TOKEN) return res.status(403).json({ error: 'Forbidden' });
  next();
}

// Admin endpoints: list orders and users (passwords redacted)
app.get('/api/admin/orders', adminAuth, (req, res) => {
  try {
    const db = readDb();
    res.json({ orders: db.orders || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not read orders' });
  }
});

app.get('/api/admin/users', adminAuth, (req, res) => {
  try {
    const db = readDb();
    const users = (db.users || []).map(u => ({ id: u.id, email: u.email, name: u.name, created_at: u.created_at }));
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not read users' });
  }
});

// Admin: save products.json (overwrite)
app.post('/api/admin/save-products', adminAuth, (req, res) => {
  try {
    const products = req.body && Array.isArray(req.body.products) ? req.body.products : null;
    if (!products) return res.status(400).json({ error: 'Invalid payload, expected { products: [] }' });
    const prodPath = path.join(dataDir, 'products.json');
    fs.writeFileSync(prodPath, JSON.stringify({ products }, null, 2));
    res.json({ ok: true, count: products.length });
  } catch (err) {
    console.error('save products error', err);
    res.status(500).json({ error: 'Could not save products' });
  }
});

// Serve a simple SEO-friendly product page for each product
app.get('/product/:id', (req, res) => {
  try {
    const prodPath = path.join(dataDir, 'products.json');
    if (!fs.existsSync(prodPath)) return res.status(404).send('Not found');
    const raw = fs.readFileSync(prodPath, 'utf8');
    const all = JSON.parse(raw || '{}');
    const products = all.products || [];
    const prod = products.find(p => String(p.id) === String(req.params.id) || String(p.sku) === String(req.params.id));
    if (!prod) return res.status(404).send('Product not found');
    const title = prod.name || 'Product';
    const description = (prod.description || '').slice(0, 160);
    const image = prod.image || (prod.raw && (prod.raw.media_url || prod.raw.thumbnail_url)) || '';
    const siteUrl = (req.protocol + '://' + req.get('host')).replace(/:\d+$/, '');
    const url = siteUrl + '/product/' + encodeURIComponent(req.params.id);
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${url}" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: prod.name,
      description: prod.description,
      image: image ? [image] : [],
      sku: prod.sku || prod.id,
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: (prod.price || 0).toString(),
        availability: prod.published ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: url
      }
    })}</script>
  <style>body{font-family:system-ui,Segoe UI,Roboto,Arial;padding:20px;max-width:900px;margin:auto}img{max-width:100%;height:auto}</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(prod.description || '')}</p>
  ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}">` : ''}
  <p><strong>Price:</strong> $${(prod.price||0).toFixed(2)}</p>
  <p><a href="/">Back to store</a></p>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (err) {
    console.error('product page error', err);
    return res.status(500).send('Server error');
  }
});

// Simple sitemap generator for published products
app.get('/sitemap.xml', (req, res) => {
  try {
    const prodPath = path.join(dataDir, 'products.json');
    const products = fs.existsSync(prodPath) ? (JSON.parse(fs.readFileSync(prodPath, 'utf8')) || {}).products || [] : [];
    const siteUrl = (req.protocol + '://' + req.get('host')).replace(/:\d+$/, '');
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
});

// robots.txt
app.get('/robots.txt', (req, res) => {
  const siteUrl = (req.protocol + '://' + req.get('host')).replace(/:\d+$/, '');
  res.setHeader('Content-Type', 'text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml`);
});

// small helper to escape HTML in templates
function escapeHtml(s){
  if(!s) return '';
  return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c));
}

// Create order record
app.post('/api/create-order', authMiddleware, async (req, res) => {
  const { items, amount_cents } = req.body;
  if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Invalid items' });
  try {
    const order = createOrder({ user_id: req.user.id, items, amount_cents });

    // send receipt email
    try {
      const user = await findUserById(req.user.id);
      if (user && user.email) {
        const lines = items.map(i => `${i.quantity || 1}× ${i.name} @ $${(i.price||0).toFixed(2)}`).join('\n');
        const htmlLines = items.map(i => `<li>${i.quantity||1}× ${escapeHtml(i.name)} @ $${(i.price||0).toFixed(2)}</li>`).join('');
        const total = ((amount_cents||0)/100).toFixed(2);
        await sendEmail({
          to: user.email,
          subject: `Your order #${order.id} receipt`,
          text: `Thank you for your order!\n\n${lines}\n\nTotal: $${total}`,
          html: `<p>Thank you for your order!</p><ul>${htmlLines}</ul><p><strong>Total: $${total}</strong></p>`
        });
      }
    } catch (e) {
      console.warn('receipt email failed', e && e.message);
    }

    res.json({ ok: true, orderId: order.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create order' });
  }
});

// Create Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured on server' });
  const { items, success_url, cancel_url, payment_method_types } = req.body;
  if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Invalid items' });
  try {
    const line_items = items.map(i => ({ price_data: { currency: 'usd', product_data: { name: i.name }, unit_amount: Math.round((i.price || 0) * 100) }, quantity: i.quantity || 1 }));
    const session = await stripe.checkout.sessions.create({
      payment_method_types: payment_method_types || ['card'],
      mode: 'payment',
      line_items,
      success_url: success_url || (req.headers.origin + '/?checkout=success'),
      cancel_url: cancel_url || (req.headers.origin + '/?checkout=canceled')
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe session error', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create PaymentIntent for in-page card payments
app.post('/api/create-payment-intent', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured on server' });
  const { items, currency } = req.body;
  if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Invalid items' });
  try {
    const amount = items.reduce((s, i) => s + Math.round((i.price || 0) * 100) * (i.quantity || 1), 0);
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || 'usd',
      // let Stripe auto-select available payment methods for the account
      automatic_payment_methods: { enabled: true }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('PaymentIntent error', err);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Admin route: update order status and notify user
app.post('/api/admin/update-order', adminAuth, async (req, res) => {
  const { id, status } = req.body || {};
  if (typeof id === 'undefined' || typeof status === 'undefined') {
    return res.status(400).json({ error: 'id and status required' });
  }
  const order = findOrderById(Number(id));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.status = status;
  if (!updateOrder(order)) return res.status(500).json({ error: 'Could not update order' });

  // send status email
  try {
    const user = await findUserById(order.user_id);
    if (user && user.email) {
      await sendEmail({
        to: user.email,
        subject: `Order #${order.id} status updated`,
        text: `Your order #${order.id} is now: ${status}`,
        html: `<p>Your order <strong>#${order.id}</strong> is now: <em>${status}</em></p>`
      });
    }
  } catch (e) {
    console.warn('status email failed', e && e.message);
  }

  res.json({ ok: true, order });
});

// Static file serving for front-end if needed
app.use(express.static(path.join(__dirname, '..')));

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
