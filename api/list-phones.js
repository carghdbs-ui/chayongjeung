// api/list-phones.js
// 관리자: 입금 대기 고객 전화번호 목록 조회
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
    const rawList = await client.lRange('phone_list', 0, 49);
    const phones = rawList.map(r => JSON.parse(r));
    await client.disconnect();
    return res.status(200).json({ success: true, phones });
  } catch(e) {
    return res.status(500).json({ success: false, message: e.message });
  }
}
