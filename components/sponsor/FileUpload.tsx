/**
 * 文件上傳组件
 * 
 * 支持拖拽上傳和点击選择
 */

import React, { useState, useRef } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string;
  maxSizeMB?: number;
  description?: string;
  currentFileUrl?: string;
  currentFileName?: string;
}

export default function FileUpload({
  onFileSelect,
  acceptedTypes = '*',
  maxSizeMB = 10,
  description,
  currentFileUrl,
  currentFileName,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);

    // 檢查文件大小
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`文件大小不能超過 ${maxSizeMB}MB`);
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  return (
    <div>
      {/* 上傳区域 */}
      <div
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragging ? 'scale-105' : ''
        }`}
        style={{
          borderColor: isDragging ? '#1a3a6e' : '#d1d5db',
          backgroundColor: isDragging ? '#e8eef5' : '#f9fafb',
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <svg
          className="w-12 h-12 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: isDragging ? '#1a3a6e' : '#9ca3af' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        <p className="text-sm font-medium mb-1" style={{ color: '#1a3a6e' }}>
          {isDragging ? '释放以上傳文件' : '点击或拖拽文件到這里上傳'}
        </p>

        {description && (
          <p className="text-xs" style={{ color: '#6b7280' }}>
            {description}
          </p>
        )}

        <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>
          最大文件大小：{maxSizeMB}MB
        </p>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileInput}
        className="hidden"
      />

      {/* 错误提示 */}
      {error && (
        <div
          className="mt-3 p-3 rounded-lg text-sm"
          style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
        >
          {error}
        </div>
      )}

      {/* 當前文件 */}
      {currentFileName && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: '#e8eef5' }}>
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: '#1a3a6e' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-sm flex-1 truncate" style={{ color: '#1a3a6e' }}>
            {currentFileName}
          </span>
          {currentFileUrl && (
            <a
              href={currentFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline"
              style={{ color: '#1a3a6e' }}
              onClick={(e) => e.stopPropagation()}
            >
              查看
            </a>
          )}
        </div>
      )}
    </div>
  );
}

