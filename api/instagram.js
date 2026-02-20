// api/instagram.js
const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
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
};
