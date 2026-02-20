// api/register.js
const bcrypt = require('bcryptjs');
const { createUser, updateUser } = require('../server/services/userService');
const { sendEmail } = require('../server/services/emailService');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Password strength validation
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser({ email, passwordHash: hashed, name });
    try {
      const verifyToken = crypto.randomBytes(20).toString('hex');
      user.verifyToken = verifyToken;
      user.verifyExpires = Date.now() + 1000 * 60 * 60 * 24;
      await updateUser(user);
      const origin = req.headers.origin || (req.headers['x-forwarded-proto'] + '://' + req.headers.host);
      const verifyUrl = `${origin}/verify.html?token=${verifyToken}`;
      await sendEmail({ to: user.email, subject: 'Verify your AnyaBikini account', text: `Verify: ${verifyUrl}`, html: `<p>Click to verify your account: <a href="${verifyUrl}">${verifyUrl}</a></p>` });
    } catch (e) {
      console.warn('verify email send failed', e && e.message);
    }
    const token = signToken({ id: user.id, email });
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000`);
    res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    if (err.message === 'exists') return res.status(400).json({ error: 'Email already exists' });
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
