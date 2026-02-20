// Instagram service: fetches Instagram media
const axios = require('axios');

async function fetchInstagramMedia() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  if (!token || !userId) throw new Error('Instagram access not configured');
  const url = `https://graph.instagram.com/${userId}/media?fields=id,caption,media_url,permalink,thumbnail_url,media_type&access_token=${token}`;
  const resp = await axios.get(url);
  return resp.data && resp.data.data ? resp.data.data : [];
}

module.exports = { fetchInstagramMedia };
