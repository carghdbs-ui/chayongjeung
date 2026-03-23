// api/save-phone.js
import { createClient } from 'redis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { name, phone, savedAt } = req.body;
  if (!phone) return res.status(400).json({ success: false, message: '번호 없음' });

  try {
    const client = createClient({ url: process.env.REDIS_URL });
    await client.connect();

    const entry = JSON.stringify({
      name: name || '이름미입력',
      phone,
      savedAt: savedAt || new Date().toLocaleTimeString('ko-KR')
    });

    await client.setEx(`phone:${phone}`, 86400, entry);

    // 기존 같은 번호 제거 후 새로 추가
    const existing = await client.lRange('phone_list', 0, -1);
    const filtered = existing.filter(e => {
      try { return JSON.parse(e).phone !== phone; } catch { return true; }
    });
    await client.del('phone_list');
    for (const e of filtered) await client.rPush('phone_list', e);
    await client.lPush('phone_list', entry);
    await client.lTrim('phone_list', 0, 99);

    await client.disconnect();
    return res.status(200).json({ success: true });
  } catch(e) {
    return res.status(500).json({ success: false, message: e.message });
  }
}
