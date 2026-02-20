// api/register.js
const bcrypt = require('bcryptjs');
const { createUser, updateUser } = require('../server/services/userService');
const { sendEmail } = require('../server/services/emailService');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = createUser({ email, passwordHash: hashed, name });
    try {
      const verifyToken = crypto.randomBytes(20).toString('hex');
      user.verifyToken = verifyToken;
      user.verifyExpires = Date.now() + 1000 * 60 * 60 * 24;
      updateUser(user);
      const origin = req.headers.origin || (req.headers['x-forwarded-proto'] + '://' + req.headers.host);
      const verifyUrl = `${origin}/verify.html?token=${verifyToken}`;
      await sendEmail({ to: user.email, subject: 'Verify your AnyaBikini account', text: `Verify: ${verifyUrl}`, html: `<p>Click to verify your account: <a href="${verifyUrl}">${verifyUrl}</a></p>` });
    } catch (e) {
      console.warn('verify email send failed', e && e.message);
    }
    const token = signToken({ id: user.id, email });
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; SameSite=Lax`);
    res.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    if (err.message === 'exists') return res.status(400).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
