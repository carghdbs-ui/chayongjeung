// api/verify-code.js
import { createClient } from 'redis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: '코드를 입력해주세요' });

  const upperCode = code.toUpperCase().trim();

  const client = createClient({ url: process.env.REDIS_URL });
  await client.connect();

  const raw = await client.get(`code:${upperCode}`);

  if (!raw) {
    await client.disconnect();
    return res.status(200).json({ success: false, message: '올바르지 않은 인증코드입니다. 다시 확인해주세요' });
  }

  const entry = JSON.parse(raw);

  if (entry.used) {
    await client.disconnect();
    return res.status(200).json({ success: false, message: '이미 사용된 인증코드입니다' });
  }

  // 사용 처리
  entry.used = true;
  entry.usedAt = new Date().toLocaleString('ko-KR');
  await client.setEx(`code:${upperCode}`, 86400, JSON.stringify(entry));

  await client.disconnect();
  return res.status(200).json({ success: true });
}
