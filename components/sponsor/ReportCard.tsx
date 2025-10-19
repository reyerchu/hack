/**
 * 報告卡片组件
 * 
 * 顯示單個報告的摘要和下载按钮
 */

import React from 'react';

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onDownload?: (format: 'pdf' | 'csv') => void;
  data?: any;
}

export default function ReportCard({
  title,
  description,
  icon,
  onDownload,
  data,
}: ReportCardProps) {
  return (
    <div
      className="rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-200"
      style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#e8eef5', color: '#1a3a6e' }}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#1a3a6e' }}>
            {title}
          </h3>
          <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
            {description}
          </p>

          {/* 數據预览 */}
          {data && (
            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
              <dl className="grid grid-cols-2 gap-3">
                {Object.entries(data).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs mb-1" style={{ color: '#9ca3af' }}>
                      {key}
                    </dt>
                    <dd className="text-sm font-semibold" style={{ color: '#1a3a6e' }}>
                      {value as string}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* 下载按钮 */}
          {onDownload && (
            <div className="flex gap-2">
              <button
                onClick={() => onDownload('pdf')}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: '#1a3a6e',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a4a7e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a3a6e';
                }}
              >
                下载 PDF
              </button>
              <button
                onClick={() => onDownload('csv')}
                className="px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors"
                style={{
                  borderColor: '#1a3a6e',
                  color: '#1a3a6e',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a3a6e';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#1a3a6e';
                }}
              >
                下载 CSV
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

