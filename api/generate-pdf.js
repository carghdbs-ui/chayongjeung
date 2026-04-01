// api/generate-pdf.js
// 문서 HTML을 받아서 깨끗한 PDF로 변환 후 Blob 저장
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { html, contractName, filename } = req.body;
    if (!html) return res.status(400).json({ success: false, message: 'HTML 없음' });

    // 깨끗한 HTML 페이지 생성
    const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#ffffff;font-family:'Noto Serif KR',serif;color:#1a1612;width:794px;padding:52px 60px;}
#document{background:#fff;position:static;display:block;max-width:none;margin:0;padding:0;box-shadow:none;}
#document::before{display:none!important}
.doc-title{text-align:center;font-size:22px;font-weight:600;letter-spacing:.25em;margin-bottom:5px;color:#1a1612}
.doc-subtitle{text-align:center;font-size:10px;letter-spacing:.2em;color:#7a6e67;margin-bottom:28px;font-weight:300}
.doc-body{font-size:13px;line-height:2.2;color:#1a1612;white-space:pre-wrap;word-break:keep-all}
.doc-body strong{font-weight:600;color:#1a1612}
.doc-seal-area{margin-top:36px;padding-top:20px;border-top:1px solid rgba(26,22,18,.12)}
.doc-date{text-align:center;font-size:12px;letter-spacing:.08em;color:#3d3530;margin-bottom:20px}
.sig-row{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.sig-block .role{font-size:10px;letter-spacing:.1em;color:#7a6e67;margin-bottom:5px}
.sig-block .name-line{font-size:13px;padding-bottom:3px;border-bottom:1px solid rgba(26,22,18,.12);min-height:22px}
.sig-block .sub{font-size:10px;color:#7a6e67;margin-top:3px}
.seal-stamp{display:none}
.action-bar{display:none!important}
#actbar{display:none!important}
</style>
</head>
<body>${html}</body>
</html>`;

    // HTML을 Blob에 저장
    const htmlFilename = (filename || 'contract_' + Date.now()).replace('.pdf', '.html');
    const htmlBlob = await put(
      `contracts/${htmlFilename}`,
      fullHtml,
      { access: 'public', contentType: 'text/html; charset=utf-8' }
    );

    console.log('[PDF HTML 저장]', htmlBlob.url);
    return res.status(200).json({
      success: true,
      url: htmlBlob.url,
      filename: htmlFilename,
      contractName,
      note: 'HTML 형식으로 저장됨 - 브라우저에서 PDF로 인쇄 가능'
    });

  } catch (e) {
    console.error('[generate-pdf 오류]', e);
    return res.status(500).json({ success: false, message: e.message });
  }
}
