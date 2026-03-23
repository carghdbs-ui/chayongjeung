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

  try {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    const val = await client.get(`code:${upperCode}`);

    if (!val) {
      await client.disconnect();
      return res.status(200).json({ success: false, message: '올바르지 않은 인증코드입니다. 다시 확인해주세요' });
    }
    if (val === 'used') {
      await client.disconnect();
      return res.status(200).json({ success: false, message: '이미 사용된 인증코드입니다' });
    }

    // 사용 처리
    await client.set(`code:${upperCode}`, 'used', { KEEPTTL: true });
    await client.disconnect();
    return res.status(200).json({ success: true });
  } catch(e) {
    return res.status(500).json({ success: false, message: 'Redis 오류: ' + e.message });
  }
}
