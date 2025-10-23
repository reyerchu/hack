/**
 * Add Sponsor 頁面
 *
 * Super_admin 可以添加新的贊助商
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import firebase from 'firebase/app';
import 'firebase/auth';
import { useAuthContext } from '../../lib/user/AuthContext';
import AdminHeader from '../../components/adminComponents/AdminHeader';

export default function AddSponsorPage() {
  const router = useRouter();
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState(false);

  // 表單數據
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    tier: 'track',
    description: '',
    logoUrl: '',
    iconUrl: '',
    websiteUrl: '',
    contactEmail: '',
    contactName: '',
  });

  // 文件上傳
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [iconPreview, setIconPreview] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  // 權限檢查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/admin/add-sponsor');
    } else if (!authLoading && isSignedIn) {
      const checkAdmin = async () => {
        try {
          const currentUser = firebase.auth().currentUser;
          if (!currentUser) return;

          const token = await currentUser.getIdToken();
          const response = await fetch('/api/user/profile', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            const profile = data.data || data;
            const permissions = profile.permissions || profile.user?.permissions || [];

            const hasAdminAccess =
              permissions.includes('super_admin') ||
              permissions.includes('admin') ||
              permissions[0] === 'super_admin' ||
              permissions[0] === 'admin';

            setIsAdmin(hasAdminAccess);

            if (!hasAdminAccess) {
              router.push('/');
            }
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          router.push('/');
        }
      };

      checkAdmin();
    }
  }, [authLoading, isSignedIn, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 處理 Logo 上傳
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 處理 Icon 上傳
  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 處理其他文檔上傳
  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setDocuments(Array.from(files));
    }
  };

  // 移除文檔
  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證必填欄位
    if (!formData.id || !formData.name) {
      setMessage('請填寫 Sponsor ID 和名稱');
      setMessageType('error');
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage('');

      // 注意：這裡目前只保存表單數據，文件上傳功能需要配置雲端存儲
      // 如果需要實際上傳文件，請配置 Firebase Storage 或其他雲端存儲服務
      const filesInfo = {
        logoFile: logoFile
          ? { name: logoFile.name, size: logoFile.size, type: logoFile.type }
          : null,
        iconFile: iconFile
          ? { name: iconFile.name, size: iconFile.size, type: iconFile.type }
          : null,
        documents: documents.map((doc) => ({ name: doc.name, size: doc.size, type: doc.type })),
      };

      console.log('Files to upload:', filesInfo);
      setMessageType('');

      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        throw new Error('未登入');
      }
      const token = await currentUser.getIdToken();

      const response = await fetch('/api/admin/sponsors/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '新增失敗');
      }

      const data = await response.json();
      setMessage('✅ Sponsor 新增成功！');
      setMessageType('success');

      // 2 秒後跳轉回 Admin 頁面
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (err: any) {
      console.error('Error adding sponsor:', err);
      setMessage(`❌ ${err.message}`);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col flex-grow">
        <Head>
          <title>新增 Sponsor - 管理員儀表板</title>
          <meta name="description" content="Add Sponsor" />
        </Head>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="mb-12">
              <h1 className="text-4xl font-bold mb-2 text-left" style={{ color: '#1a3a6e' }}>
                管理儀表板
              </h1>
            </div>
            <AdminHeader />
            <div className="animate-pulse">
              <div className="h-10 bg-gray-300 rounded w-64 mb-4"></div>
              <div className="h-6 bg-gray-300 rounded w-48"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow">
      <Head>
        <title>新增 Sponsor - 管理員儀表板</title>
        <meta name="description" content="Add Sponsor" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2 text-left" style={{ color: '#1a3a6e' }}>
              管理儀表板
            </h1>
          </div>

          <AdminHeader />

          {/* Add Sponsor Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a3a6e' }}>
              新增 Sponsor
            </h2>
            <p className="text-base text-gray-600 mb-6">添加新的贊助商資料</p>
            {message && (
              <div
                className={`p-4 mb-6 rounded-lg border-2 ${
                  messageType === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <p
                  className="text-[14px]"
                  style={{
                    color: messageType === 'success' ? '#166534' : '#991b1b',
                  }}
                >
                  {message}
                </p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-lg p-8 border-2"
              style={{ borderColor: '#e5e7eb' }}
            >
              {/* Sponsor ID */}
              <div className="mb-6">
                <label
                  htmlFor="id"
                  className="block text-[16px] font-semibold mb-2"
                  style={{ color: '#1a3a6e' }}
                >
                  Sponsor ID *
                </label>
                <input
                  type="text"
                  id="id"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  required
                  placeholder="例如：sponsor-imtoken"
                  className="w-full px-4 py-3 border-2 rounded-lg text-[16px]"
                  style={{ borderColor: '#d1d5db' }}
                />
                <p className="text-[12px] text-gray-500 mt-1">
                  唯一識別碼，建議格式：sponsor-公司名稱（小寫英文）
                </p>
              </div>

              {/* Sponsor Name */}
              <div className="mb-6">
                <label
                  htmlFor="name"
                  className="block text-[16px] font-semibold mb-2"
                  style={{ color: '#1a3a6e' }}
                >
                  贊助商名稱 *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="例如：imToken"
                  className="w-full px-4 py-3 border-2 rounded-lg text-[16px]"
                  style={{ borderColor: '#d1d5db' }}
                />
              </div>

              {/* Tier */}
              <div className="mb-6">
                <label
                  htmlFor="tier"
                  className="block text-[16px] font-semibold mb-2"
                  style={{ color: '#1a3a6e' }}
                >
                  贊助等級
                </label>
                <select
                  id="tier"
                  name="tier"
                  value={formData.tier}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 rounded-lg text-[16px]"
                  style={{ borderColor: '#d1d5db' }}
                >
                  <option value="title">Title Sponsor（冠名贊助）</option>
                  <option value="track">Track Sponsor（賽道贊助）</option>
                  <option value="venue">Venue Sponsor（場地贊助）</option>
                  <option value="prize">Prize Sponsor（獎項贊助）</option>
                  <option value="other">Other（其他）</option>
                </select>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label
                  htmlFor="description"
                  className="block text-[16px] font-semibold mb-2"
                  style={{ color: '#1a3a6e' }}
                >
                  描述
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="贊助商簡介..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 rounded-lg text-[16px]"
                  style={{ borderColor: '#d1d5db' }}
                />
              </div>

              {/* Logo Upload */}
              <div className="mb-6">
                <label
                  className="block text-[16px] font-semibold mb-2"
                  style={{ color: '#1a3a6e' }}
                >
                  上傳 Logo
                </label>
                <div
                  className="border-2 border-dashed rounded-lg p-6"
                  style={{ borderColor: '#d1d5db' }}
                >
                  <input
                    type="file"
                    id="logoFile"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <label htmlFor="logoFile" className="cursor-pointer flex flex-col items-center">
                    {logoPreview ? (
                      <div className="mb-4">
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="max-h-32 rounded-lg border-2"
                          style={{ borderColor: '#e5e7eb' }}
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">點擊選擇圖片</p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    )}
                  </label>
                  {logoFile && (
                    <div className="mt-2 text-center">
                      <p className="text-sm text-gray-600">{logoFile.name}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview('');
                        }}
                        className="text-sm text-red-600 hover:text-red-800 mt-1"
                      >
                        移除
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[12px] text-gray-500 mt-1">
                  或使用下方 URL 欄位直接輸入圖片連結
                </p>
              </div>

              {/* Logo URL */}
              <div className="mb-6">
                <label
                  htmlFor="logoUrl"
                  className="block text-[16px] font-semibold mb-2"
                  style={{ color: '#1a3a6e' }}
                >
                  Logo URL (替代方案)
                </label>
                <input
                  type="url"
                  id="logoUrl"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-3 border-2 rounded-lg text-[16px]"
                  style={{ borderColor: '#d1d5db' }}
                />
              </div>

              {/* Icon Upload */}
              <div className="mb-6">
                <label
                  className="block text-[16px] font-semibold mb-2"
                  style={{ color: '#1a3a6e' }}
                >
                  上傳 Icon
                </label>
                <div
                  className="border-2 border-dashed rounded-lg p-6"
                  style={{ borderColor: '#d1d5db' }}
                >
                  <input
                    type="file"
                    id="iconFile"
                    accept="image/*"
                    onChange={handleIconChange}
                    className="hidden"
                  />
                  <label htmlFor="iconFile" className="cursor-pointer flex flex-col items-center">
                    {iconPreview ? (
                      <div className="mb-4">
                        <img
                          src={iconPreview}
                          alt="Icon Preview"
                          className="max-h-24 rounded-lg border-2"
                          style={{ borderColor: '#e5e7eb' }}
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">點擊選擇圖片</p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                      </div>
                    )}
                  </label>
                  {iconFile && (
                    <div className="mt-2 text-center">
                      <p className="text-sm text-gray-600">{iconFile.name}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setIconFile(null);
                          setIconPreview('');
                        }}
                        className="text-sm text-red-600 hover:text-red-800 mt-1"
                      >
                        移除
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[12px] text-gray-500 mt-1">較小的圖示，用於列表或縮略顯示</p>
              </div>

              {/* Icon URL */}
              <div className="mb-6">
                <label
                  htmlFor="iconUrl"
                  className="block text-[16px] font-semibold mb-2"
                  style={{ color: '#1a3a6e' }}
                >
                  Icon URL (替代方案)
                </label>
                <input
                  type="url"
                  id="iconUrl"
                  name="iconUrl"
                  value={formData.iconUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/icon.png"
                  className="w-full px-4 py-3 border-2 rounded-lg text-[16px]"
                  style={{ borderColor: '#d1d5db' }}
                />
              </div>

              {/* Website URL */}
              <div className="mb-6">
                <label
                  htmlFor="websiteUrl"
                  className="block text-[16px] font-semibold mb-2"
                  style={{ color: '#1a3a6e' }}
                >
                  官網 URL
                </label>
                <input
                  type="url"
                  id="websiteUrl"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border-2 rounded-lg text-[16px]"
                  style={{ borderColor: '#d1d5db' }}
                />
              </div>

              {/* Contact Email */}
              <div className="mb-6">
                <label
                  htmlFor="contactEmail"
                  className="block text-[16px] font-semibold mb-2"
                  style={{ color: '#1a3a6e' }}
                >
                  聯絡 Email
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                  className="w-full px-4 py-3 border-2 rounded-lg text-[16px]"
                  style={{ borderColor: '#d1d5db' }}
                />
              </div>

              {/* Contact Name */}
              <div className="mb-6">
                <label
                  htmlFor="contactName"
                  className="block text-[16px] font-semibold mb-2"
                  style={{ color: '#1a3a6e' }}
                >
                  聯絡人
                </label>
                <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="張三"
                  className="w-full px-4 py-3 border-2 rounded-lg text-[16px]"
                  style={{ borderColor: '#d1d5db' }}
                />
              </div>

              {/* Other Documents */}
              <div className="mb-6">
                <label
                  className="block text-[16px] font-semibold mb-2"
                  style={{ color: '#1a3a6e' }}
                >
                  其他文檔
                </label>
                <div
                  className="border-2 border-dashed rounded-lg p-6"
                  style={{ borderColor: '#d1d5db' }}
                >
                  <input
                    type="file"
                    id="documents"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    onChange={handleDocumentsChange}
                    className="hidden"
                  />
                  <label htmlFor="documents" className="cursor-pointer flex flex-col items-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6m0 0v6m0-6h6m-6 0h-6"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">點擊選擇文檔</p>
                    <p className="text-xs text-gray-500">PDF, DOC, XLS, PPT 等文件</p>
                  </label>
                </div>

                {documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      已選擇 {documents.length} 個文件：
                    </p>
                    {documents.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                        style={{ borderColor: '#e5e7eb' }}
                      >
                        <div className="flex items-center space-x-3">
                          <svg
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[12px] text-gray-500 mt-2">
                  上傳合約、提案書或其他相關文件（可選多個文件）
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/admin')}
                  className="flex-1 border-2 px-8 py-3 text-[14px] font-medium uppercase tracking-wider transition-colors duration-300"
                  style={{
                    borderColor: '#6b7280',
                    color: '#6b7280',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#6b7280';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#6b7280';
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 border-2 px-8 py-3 text-[14px] font-medium uppercase tracking-wider transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderColor: '#1a3a6e',
                    color: '#1a3a6e',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = '#1a3a6e';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#1a3a6e';
                  }}
                >
                  {isSubmitting ? '新增中...' : '新增 Sponsor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
