// api/verify-code.js
// 고객이 입력한 인증코드를 검증하는 API

let codeStore = global._codeStore || (global._codeStore = []);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: '코드를 입력해주세요' });

  codeStore = global._codeStore || [];
  const upperCode = code.toUpperCase().trim();
  const found = codeStore.find(c => c.code === upperCode && !c.used);

  if (found) {
    found.used = true;
    found.usedAt = new Date().toLocaleTimeString('ko-KR');
    global._codeStore = codeStore;
    console.log('[코드 사용]', upperCode);
    return res.status(200).json({ success: true });
  } else {
    const expired = codeStore.find(c => c.code === upperCode && c.used);
    const msg = expired
      ? '이미 사용된 인증코드입니다'
      : '올바르지 않은 인증코드입니다. 다시 확인해주세요';
    return res.status(200).json({ success: false, message: msg });
  }
}
