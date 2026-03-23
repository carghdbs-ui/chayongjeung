// api/generate-code.js
import { createClient } from 'redis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { adminPw } = req.body;
  if (adminPw !== process.env.ADMIN_PW) {
    return res.status(403).json({ success: false, message: '비밀번호 오류' });
  }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

  try {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    await client.setEx(`code:${code}`, 86400, 'unused');
    const entry = JSON.stringify({ code, created: new Date().toLocaleTimeString('ko-KR'), used: false });
    await client.lPush('code_list', entry);
    await client.lTrim('code_list', 0, 99);
    await client.disconnect();
    return res.status(200).json({ success: true, code });
  } catch(e) {
    return res.status(500).json({ success: false, message: 'Redis 오류: ' + e.message });
  }
}
