// api/list-codes.js
import { createClient } from 'redis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { adminPw } = req.body;
  if (adminPw !== process.env.ADMIN_PW) {
    return res.status(403).json({ success: false, message: '권한 없음' });
  }

  try {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();
    const rawList = await client.lRange('code_list', 0, 49);

    // 각 코드의 실제 사용 여부를 Redis에서 확인
    const codes = await Promise.all(rawList.map(async (raw) => {
      const item = JSON.parse(raw);
      const val = await client.get(`code:${item.code}`);
      return { ...item, used: val === 'used' || val === null };
    }));

    await client.disconnect();
    return res.status(200).json({ success: true, codes });
  } catch(e) {
    return res.status(500).json({ success: false, message: 'Redis 오류: ' + e.message });
  }
}
