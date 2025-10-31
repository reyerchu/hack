import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAuthContext } from '../../lib/user/AuthContext';
import { useRouter } from 'next/router';

interface CheckinRecord {
  userId: string;
  userName: string;
  userEmail: string;
  teamName?: string;
  checkedInAt: any;
  checkedInBy: string;
}

export default function CheckinPage() {
  const { user, profile, isSignedIn } = useAuthContext();
  const authLoading = !isSignedIn;
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [lastScanned, setLastScanned] = useState<CheckinRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Check if user is admin
    if (user && user.permissions) {
      const isAdmin =
        user.permissions.includes('admin') ||
        user.permissions.includes('super_admin') ||
        user.permissions.includes('organizer');
      if (!isAdmin) {
        router.push('/');
        return;
      }
    }

    if (!scanning) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false,
    );

    scanner.render(onScanSuccess, onScanError);

    return () => {
      scanner.clear().catch(console.error);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning, user, authLoading, router]);

  const onScanSuccess = async (decodedText: string) => {
    if (processing) return;

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      // Parse the QR code data
      let userId: string;

      // Check if it's the hack:{userId} format
      if (decodedText.startsWith('hack:')) {
        userId = decodedText.replace('hack:', '');
      } else if (decodedText.startsWith('http')) {
        // If QR code is a URL, extract user ID
        const url = new URL(decodedText);
        userId = url.searchParams.get('userId') || url.pathname.split('/').pop() || '';
      } else {
        // Assume it's a direct user ID
        userId = decodedText;
      }

      if (!userId) {
        throw new Error('無效的 QR code');
      }

      // Call API to create check-in
      const response = await fetch('/api/checkins/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: user?.token || '',
        },
        body: JSON.stringify({
          userId,
          checkedInBy: profile?.user?.preferredEmail || 'admin',
        }),
      });

      const data = await response.json();

      if (response.status === 409) {
        // Already checked in
        setError(data.message || '此用戶已報到');
        setProcessing(false);
        setTimeout(() => setError(null), 3000);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || '報到失敗');
      }

      // Success
      const checkinRecord: CheckinRecord = data.checkin;
      setLastScanned(checkinRecord);
      setSuccess('✅ 報到成功！');

      // Play success sound
      const audio = new Audio('/sounds/success.mp3');
      audio.play().catch(() => {}); // Ignore if sound file doesn't exist

      setTimeout(() => {
        setSuccess(null);
        setProcessing(false);
      }, 2000);
    } catch (err: any) {
      console.error('Check-in error:', err);
      setError(err.message || '報到失敗');
      setProcessing(false);
      setTimeout(() => setError(null), 3000);
    }
  };

  const onScanError = (errorMessage: string) => {
    // Ignore scan errors (they happen frequently during scanning)
    // console.log('Scan error:', errorMessage);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">RWA 黑客松 2025 - 報到系統</h1>
          <p className="text-gray-600">請將參賽者的 QR code 對準攝影機掃描</p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium text-2xl">{success}</span>
            </div>
          </div>
        )}

        {/* Scanner */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div id="qr-reader" className="w-full"></div>

          {processing && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">處理中...</p>
            </div>
          )}
        </div>

        {/* Last Scanned Info */}
        {lastScanned && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">最近報到</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">姓名：</span>
                <span className="font-semibold text-lg">{lastScanned.userName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">郵箱：</span>
                <span className="font-medium">{lastScanned.userEmail}</span>
              </div>
              {lastScanned.teamName && (
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">團隊：</span>
                  <span className="font-medium">{lastScanned.teamName}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">報到時間：</span>
                <span className="font-medium">{new Date().toLocaleString('zh-TW')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">使用說明：</h3>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>請允許瀏覽器使用攝影機權限</li>
            <li>將參賽者的 QR code 對準掃描框</li>
            <li>系統會自動識別並記錄報到</li>
            <li>若重複掃描會顯示已報到訊息</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
