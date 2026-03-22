// api/generate-code.js
import { createClient } from 'redis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { adminPw } = req.body;
  const ADMIN_PW = process.env.ADMIN_PW || '0640';

  if (adminPw !== ADMIN_PW) {
    return res.status(403).json({ success: false, message: '비밀번호가 올바르지 않습니다' });
  }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

  const client = createClient({ url: process.env.REDIS_URL });
  await client.connect();

  const entry = {
    code,
    created: new Date().toLocaleString('ko-KR'),
    used: false
  };
  // 코드 저장 (24시간 유효)
  await client.setEx(`code:${code}`, 86400, JSON.stringify(entry));
  // 목록에도 추가
  await client.lPush('code_list', JSON.stringify(entry));
  await client.lTrim('code_list', 0, 99);

  await client.disconnect();
  return res.status(200).json({ success: true, code });
}
