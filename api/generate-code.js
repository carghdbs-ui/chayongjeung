// api/generate-code.js
// 관리자가 인증코드를 생성하는 API
// 환경변수: ADMIN_PW, KV_URL (Vercel KV 또는 파일 기반)

const CODES_KEY = 'chayong_codes';

// 간단한 메모리 저장소 (Vercel은 서버리스라 재시작시 초기화됨)
// 실제 운영시 Vercel KV 또는 Upstash Redis 권장
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
    return res.status(403).json({ success: false, message: '관리자 비밀번호가 올바르지 않습니다' });
  }

  // 6자리 코드 생성
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];

  const entry = {
    code,
    created: new Date().toLocaleTimeString('ko-KR'),
    createdAt: Date.now(),
    used: false
  };

  codeStore.unshift(entry);
  if (codeStore.length > 100) codeStore = codeStore.slice(0, 100);
  global._codeStore = codeStore;

  console.log('[코드 생성]', code);
  return res.status(200).json({ success: true, code });
}
