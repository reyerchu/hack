import { useEffect } from 'react';

export default function BootcampPage() {
  useEffect(() => {
    // Redirect to the standalone bootcamp.html (with its own navigation)
    // This avoids showing hackathon.com.tw's menu bar
    window.location.href = '/bootcamp.html';
  }, []);

  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
    >
      <p>正在跳轉到特訓營頁面...</p>
    </div>
  );
}
