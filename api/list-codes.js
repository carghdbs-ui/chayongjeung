// api/list-codes.js
// 관리자가 발급 내역을 조회하는 API

let codeStore = global._codeStore || (global._codeStore = []);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { adminPw } = req.body;
  const ADMIN_PW = process.env.ADMIN_PW || '0640';

  if (adminPw !== ADMIN_PW) {
    return res.status(403).json({ success: false, message: '권한 없음' });
  }

  codeStore = global._codeStore || [];
  return res.status(200).json({ success: true, codes: codeStore.slice(0, 50) });
}
