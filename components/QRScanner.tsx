import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  width?: number;
  height?: number;
}

export default function QRScanner({ onScanSuccess, onScanError, width = 300, height = 300 }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'qr-reader-region';

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(qrRegionId);
    }

    const qrCodeSuccessCallback = (decodedText: string) => {
      onScanSuccess(decodedText);
    };

    const qrCodeErrorCallback = (errorMessage: string) => {
      // 忽略频繁的扫描错误，只在需要时记录
      if (onScanError && !errorMessage.includes('NotFoundException')) {
        onScanError(errorMessage);
      }
    };

    const config = {
      fps: 10,
      qrbox: { width: Math.min(250, width - 50), height: Math.min(250, height - 50) },
      aspectRatio: 1.0,
    };

    // 启动扫描器
    scannerRef.current
      .start(
        { facingMode: 'environment' }, // 使用后置摄像头
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
      )
      .catch((err) => {
        console.error('无法启动 QR 扫描器:', err);
        if (onScanError) {
          onScanError('无法访问摄像头，请确保已授予权限');
        }
      });

    // 清理函数
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            console.log('QR 扫描器已停止');
          })
          .catch((err) => {
            console.error('停止扫描器时出错:', err);
          });
      }
    };
  }, [onScanSuccess, onScanError, width, height]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        id={qrRegionId}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          border: '2px solid #1a3a6e',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      />
      <p className="mt-4 text-sm text-gray-600 text-center">
        請將 QR code 對準掃描框
      </p>
    </div>
  );
}

