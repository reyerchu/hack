import { useEffect } from 'react';

export default function Bootcamp2Page() {
  useEffect(() => {
    // Redirect to the standalone bootcamp2.html (with its own navigation)
    window.location.href = '/bootcamp2.html';
  }, []);

  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
    >
      <p>正在跳轉到第二屆特訓營頁面...</p>
    </div>
  );
}
