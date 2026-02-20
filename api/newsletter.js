// Newsletter API endpoint: POST /api/newsletter
// Body: { email: string }
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Store newsletter subscribers in a file relative to the server directory.
const NEWSLETTER_JSON = process.env.NEWSLETTER_PATH || path.join(__dirname, '../server/data/newsletter.json');

function readNewsletterDb() {
  try {
    if (!fs.existsSync(NEWSLETTER_JSON)) {
      const dataDir = path.dirname(NEWSLETTER_JSON);
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(NEWSLETTER_JSON, JSON.stringify({ subscribers: [] }, null, 2));
    }
    const raw = fs.readFileSync(NEWSLETTER_JSON, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('readNewsletterDb error', err);
    return { subscribers: [] };
  }
}

function writeNewsletterDb(dbObj) {
  const dataDir = path.dirname(NEWSLETTER_JSON);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(NEWSLETTER_JSON, JSON.stringify(dbObj, null, 2));
}

module.exports = async function newsletter(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  const db = readNewsletterDb();
  if (db.subscribers.find(s => s.email === email)) {
    return res.status(200).json({ ok: true, message: 'Already subscribed' });
  }
  db.subscribers.push({ email, subscribed_at: new Date().toISOString() });
  writeNewsletterDb(db);

  // Send welcome email (if SMTP configured)
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: email,
        subject: 'Welcome to AnyaBikini Newsletter!',
        text: 'Thank you for subscribing to AnyaBikini. Stay tuned for exclusive offers and updates!',
        html: '<p>Thank you for subscribing to <b>AnyaBikini</b>! Stay tuned for exclusive offers and updates.</p>'
      });
    } catch (e) {
      console.warn('Newsletter welcome email failed', e && e.message);
    }
  }
  res.json({ ok: true });
};
