// api/upload-pdf.js
// PDF를 Vercel Blob에 저장하고 다운로드 링크 반환
import { put } from '@vercel/blob';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // multipart/form-data 파싱
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    const boundary = req.headers['content-type'].split('boundary=')[1];

    // 파일 파트 추출
    const parts = buffer.toString('binary').split('--' + boundary);
    let fileBuffer = null;
    let filename = 'contract_' + Date.now() + '.pdf';
    let contractName = '계약서';

    for (const part of parts) {
      if (part.includes('name="contractName"')) {
        const match = part.match(/\r\n\r\n(.+)\r\n/);
        if (match) contractName = match[1].trim();
      }
      if (part.includes('filename=')) {
        const fnMatch = part.match(/filename="([^"]+)"/);
        if (fnMatch) filename = fnMatch[1];
        const dataStart = part.indexOf('\r\n\r\n') + 4;
        const dataEnd = part.lastIndexOf('\r\n');
        if (dataStart > 0 && dataEnd > dataStart) {
          fileBuffer = Buffer.from(part.slice(dataStart, dataEnd), 'binary');
        }
      }
    }

    if (!fileBuffer) {
      return res.status(400).json({ success: false, message: 'PDF 파일을 찾을 수 없습니다' });
    }

    // Vercel Blob에 업로드 (7일 후 자동 삭제 불가 — 수동 관리)
    const blob = await put(`contracts/${Date.now()}_${filename}`, fileBuffer, {
      access: 'public',
      contentType: 'application/pdf',
    });

    console.log('[PDF 업로드]', blob.url);
    return res.status(200).json({
      success: true,
      url: blob.url,
      filename,
      contractName,
    });

  } catch (e) {
    console.error('[PDF 업로드 오류]', e);
    return res.status(500).json({ success: false, message: e.message });
  }
}
