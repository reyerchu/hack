import React from 'react';
import Link from 'next/link';

export default function TestButtons() {
  return (
    <div style={{ padding: '4rem', backgroundColor: 'white' }}>
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem' }}>按鈕測試頁面</h1>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <a
          href="https://hackathon.com.tw/forum2025.html"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            border: '2px solid #1a3a6e',
            color: '#1a3a6e',
            padding: '0.75rem 2rem',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          RWA 論壇｜研討會
        </a>

        <Link href="/register">
          <a
            style={{
              display: 'inline-block',
              border: '2px solid #1a3a6e',
              color: '#1a3a6e',
              padding: '0.75rem 2rem',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              textTransform: 'uppercase',
            }}
          >
            立即報名 APPLY NOW
          </a>
        </Link>
      </div>

      <p style={{ marginTop: '2rem', color: '#666' }}>
        如果您能看到上面兩個按鈕，說明按鈕代碼是正確的。
      </p>

      <p style={{ marginTop: '1rem', color: '#666' }}>
        請訪問：
        <a
          href="https://hackathon.com.tw/test-buttons"
          style={{ color: '#1a3a6e', textDecoration: 'underline' }}
        >
          https://hackathon.com.tw/test-buttons
        </a>
      </p>
    </div>
  );
}
