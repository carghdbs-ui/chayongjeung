// api/send-sign.js
// ═══════════════════════════════════════════════════
//  Vercel Serverless Function
//  카카오써트(링크허브) 전자서명 발송 API
//  환경변수: LINK_ID, SECRET_KEY (Vercel 대시보드에서 설정)
// ═══════════════════════════════════════════════════

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { pdfBase64, lenderName, lenderPhone, borrowerName, borrowerPhone, title } = req.body;

  if (!pdfBase64 || !lenderName || !lenderPhone || !borrowerName || !borrowerPhone) {
    return res.status(400).json({ success: false, message: '필수 정보가 누락되었습니다.' });
  }

  const LINK_ID = process.env.LINK_ID;
  const SECRET_KEY = process.env.SECRET_KEY;

  // 환경변수 없으면 테스트 모드
  if (!LINK_ID || !SECRET_KEY) {
    console.log('[TEST MODE] 채권자:', lenderName, '/ 채무자:', borrowerName);
    return res.status(200).json({
      success: true,
      docKey: 'test_' + Date.now(),
      message: '테스트 모드'
    });
  }

  try {
    // 1. 인증 토큰 발급
    const tokenRes = await fetch('https://api.linkhub.co.kr/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ LinkID: LINK_ID, SecretKey: SECRET_KEY, scope: ['econtract'] })
    });
    const { access_token } = await tokenRes.json();
    if (!access_token) throw new Error('링크허브 인증 실패');

    // 2. 문서 등록
    const signRes = await fetch('https://api.linkhub.co.kr/econtract/v2/document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + access_token },
      body: JSON.stringify({
        title: title || '차용증',
        pdfFile: pdfBase64,
        expireDays: 7,
        signerList: [
          { name: lenderName,  hp: lenderPhone.replace(/-/g,''),  signType: 'SIGN', role: '채권자' },
          { name: borrowerName, hp: borrowerPhone.replace(/-/g,''), signType: 'SIGN', role: '채무자' }
        ]
      })
    });
    const { docKey } = await signRes.json();
    if (!docKey) throw new Error('문서 등록 실패');

    // 3. 카카오톡 발송
    await fetch(`https://api.linkhub.co.kr/econtract/v2/document/${docKey}/send`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + access_token }
    });

    return res.status(200).json({ success: true, docKey });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
