/**
 * Admin Sponsors Management 頁面
 * 
 * 管理所有贊助商，包括：
 * - 查看所有 sponsors
 * - 新增 sponsor
 * - 編輯 sponsor（未來功能）
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import firebase from 'firebase/app';
import 'firebase/auth';
import { useAuthContext } from '../../lib/user/AuthContext';
import AdminHeader from '../../components/adminComponents/AdminHeader';

interface Manager {
  email: string;
  name?: string;
  userId?: string;
  isValid?: boolean;
  isValidating?: boolean;
}

interface Sponsor {
  id: string;
  name: string;
  tier: string;
  description?: string;
  websiteUrl?: string;
  contactEmail?: string;
  contactName?: string;
  logoUrl?: string;
  iconUrl?: string;
  managers?: Manager[];
}

export default function SponsorsPage() {
  const router = useRouter();
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 狀態管理
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 新增 Sponsor 表單
  const [showAddForm, setShowAddForm] = useState(false);
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
    managers: [] as Manager[],
  });
  const [newManagerEmail, setNewManagerEmail] = useState('');
  
  // 文件上傳
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [iconPreview, setIconPreview] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  
  // 刪除功能
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');

  // 編輯功能
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    tier: 'track',
    description: '',
    logoUrl: '',
    kvImageUrl: '',
    websiteUrl: '',
    contactEmail: '',
    contactName: '',
    managers: [] as Manager[],
  });
  const [editNewManagerEmail, setEditNewManagerEmail] = useState('');
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editKvFile, setEditKvFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string>('');
  const [editKvPreview, setEditKvPreview] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState('');

  // 權限檢查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/admin/sponsors');
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

  // 獲取 sponsors 列表
  useEffect(() => {
    if (isAdmin) {
      fetchSponsors();
    }
  }, [isAdmin]);

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/admin/sponsors', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSponsors(data.data?.sponsors || []);
      } else {
        setError('無法獲取贊助商列表');
      }
    } catch (err) {
      console.error('Error fetching sponsors:', err);
      setError('載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  // 處理其他文件上傳
  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDocuments((prev) => [...prev, ...files]);
  };

  // 刪除文件
  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  // 驗證管理者 Email（新增表單）
  const validateManagerEmail = async (email: string): Promise<Manager | null> => {
    if (!email.trim()) return null;

    try {
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) return null;

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/team-register/validate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      
      if (data.isValid) {
        return {
          email: email.trim(),
          name: data.name,
          userId: data.userId,
          isValid: true,
        };
      }
      return null;
    } catch (error) {
      console.error('Error validating manager email:', error);
      return null;
    }
  };

  // 添加管理者（新增表單）
  const handleAddManager = async () => {
    if (!newManagerEmail.trim()) {
      setMessage('請輸入管理者 Email');
      setMessageType('error');
      return;
    }

    // 檢查是否已存在
    if (formData.managers.some(m => m.email.toLowerCase() === newManagerEmail.toLowerCase())) {
      setMessage('此管理者已存在');
      setMessageType('error');
      return;
    }

    const manager = await validateManagerEmail(newManagerEmail);
    if (manager) {
      setFormData(prev => ({
        ...prev,
        managers: [...prev.managers, manager],
      }));
      setNewManagerEmail('');
      setMessage('');
    } else {
      setMessage('此 Email 尚未註冊');
      setMessageType('error');
    }
  };

  // 刪除管理者（新增表單）
  const handleRemoveManager = (index: number) => {
    setFormData(prev => ({
      ...prev,
      managers: prev.managers.filter((_, i) => i !== index),
    }));
  };

  // 添加管理者（編輯表單）
  const handleAddEditManager = async () => {
    if (!editNewManagerEmail.trim()) {
      setEditMessage('請輸入管理者 Email');
      return;
    }

    // 檢查是否已存在
    if (editFormData.managers.some(m => m.email.toLowerCase() === editNewManagerEmail.toLowerCase())) {
      setEditMessage('此管理者已存在');
      return;
    }

    const manager = await validateManagerEmail(editNewManagerEmail);
    if (manager) {
      setEditFormData(prev => ({
        ...prev,
        managers: [...prev.managers, manager],
      }));
      setEditNewManagerEmail('');
      setEditMessage('');
    } else {
      setEditMessage('此 Email 尚未註冊');
    }
  };

  // 刪除管理者（編輯表單）
  const handleRemoveEditManager = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      managers: prev.managers.filter((_, i) => i !== index),
    }));
  };

  const handleDeleteClick = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setDeleteMessage('');
    setShowDeleteModal(true);
  };

  // 處理編輯點擊
  const handleEditClick = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setEditFormData({
      name: sponsor.name || '',
      tier: sponsor.tier || 'track',
      description: sponsor.description || '',
      logoUrl: sponsor.logoUrl || '',
      kvImageUrl: (sponsor as any).kvImageUrl || '',
      websiteUrl: sponsor.websiteUrl || '',
      contactEmail: sponsor.contactEmail || '',
      contactName: sponsor.contactName || '',
      managers: sponsor.managers || [],
    });
    setEditNewManagerEmail('');
    setEditLogoFile(null);
    setEditKvFile(null);
    setEditLogoPreview(sponsor.logoUrl || '');
    setEditKvPreview((sponsor as any).kvImageUrl || '');
    setEditMessage('');
    setShowEditModal(true);
  };

  // 處理編輯Logo文件選擇
  const handleEditLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 處理編輯KV文件選擇
  const handleEditKvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditKvFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditKvPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 提交編輯
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingSponsor) return;

    // 驗證
    if (!editFormData.name.trim()) {
      setEditMessage('❌ 請填寫名稱');
      return;
    }

    setIsEditing(true);
    setEditMessage('');

    try {
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        throw new Error('未認證');
      }

      const token = await currentUser.getIdToken();

      // 目前僅發送表單數據，文件上傳功能待實現
      const response = await fetch(`/api/admin/sponsors/${editingSponsor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEditMessage('✅ 贊助商更新成功！');
        
        // 刷新列表
        fetchSponsors();
        
        // 2秒後關閉 modal
        setTimeout(() => {
          setShowEditModal(false);
          setEditingSponsor(null);
          setEditMessage('');
        }, 2000);
      } else {
        setEditMessage(`❌ ${data.error || '更新失敗'}`);
      }
    } catch (error: any) {
      console.error('Error updating sponsor:', error);
      setEditMessage(`❌ 更新失敗: ${error.message}`);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSponsor) return;

    try {
      setIsDeleting(true);
      setDeleteMessage('');

      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        throw new Error('未認證');
      }

      const token = await currentUser.getIdToken();
      // TEMPORARY FIX: Add timestamp to bypass cache
      const timestamp = Date.now();
      const response = await fetch(`/api/admin/sponsors/${selectedSponsor.id}?t=${timestamp}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDeleteMessage('✅ 刪除成功！');
        
        // 刷新列表
        fetchSponsors();
        
        // 2秒後關閉 modal
        setTimeout(() => {
          setShowDeleteModal(false);
          setSelectedSponsor(null);
          setDeleteMessage('');
        }, 2000);
      } else {
        setDeleteMessage(`❌ ${data.error || '刪除失敗'}`);
        if (data.details) {
          setDeleteMessage(`❌ ${data.error}\n${data.details}`);
        }
      }
    } catch (error: any) {
      console.error('Error deleting sponsor:', error);
      setDeleteMessage(`❌ 刪除失敗: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證
    if (!formData.id.trim() || !formData.name.trim()) {
      setMessage('❌ 請填寫 ID 和名稱');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    try {
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        throw new Error('未認證');
      }

      const token = await currentUser.getIdToken();

      // 目前僅發送表單數據，文件上傳功能待實現
      const response = await fetch('/api/admin/sponsors/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage('✅ 贊助商創建成功！');
        setMessageType('success');
        
        // 重置表單
        setFormData({
          id: '',
          name: '',
          tier: 'track',
          description: '',
          logoUrl: '',
          iconUrl: '',
          websiteUrl: '',
          contactEmail: '',
          contactName: '',
          managers: [],
        });
        setNewManagerEmail('');
        setLogoFile(null);
        setIconFile(null);
        setDocuments([]);
        setLogoPreview('');
        setIconPreview('');
        
        // 刷新列表
        fetchSponsors();
        
        // 關閉表單
        setTimeout(() => {
          setShowAddForm(false);
          setMessage('');
          setMessageType('');
        }, 2000);
      } else {
        setMessage(`❌ ${data.error || '創建失敗'}`);
        setMessageType('error');
      }
    } catch (error: any) {
      console.error('Error creating sponsor:', error);
      setMessage(`❌ 創建失敗: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex flex-col flex-grow">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#1a3a6e' }}></div>
            <p className="text-base" style={{ color: '#6b7280' }}>載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow">
      <Head>
        <title>贊助商管理 - 管理員儀表板</title>
        <meta name="description" content="管理贊助商" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-20">
          {/* 標題 */}
          <div className="mb-12 text-left">
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
              管理儀表板
            </h1>
          </div>

          {/* Admin Header */}
          <AdminHeader />

          {/* 頁面標題和操作按鈕 */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
              贊助商管理
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors"
              style={{
                backgroundColor: showAddForm ? '#6b7280' : '#1a3a6e',
                color: '#ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = showAddForm ? '#4b5563' : '#2a4a7e';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = showAddForm ? '#6b7280' : '#1a3a6e';
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={showAddForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"}
                />
              </svg>
              {showAddForm ? '取消' : '新增贊助商'}
            </button>
          </div>

          {/* 新增 Sponsor 表單 */}
          {showAddForm && (
            <div className="bg-white rounded-lg p-8 shadow-sm border-2 mb-8" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="text-xl font-bold mb-6" style={{ color: '#1a3a6e' }}>
                新增贊助商
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 基本資訊 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      Sponsor ID *
                    </label>
                    <input
                      type="text"
                      name="id"
                      value={formData.id}
                      onChange={handleChange}
                      placeholder="例如: sponsor-xyz"
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ borderColor: '#d1d5db' }}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      贊助商名稱 *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="例如: ABC 公司"
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ borderColor: '#d1d5db' }}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Tier 選擇 */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    贊助等級
                  </label>
                  <select
                    name="tier"
                    value={formData.tier}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: '#d1d5db' }}
                    disabled={isSubmitting}
                  >
                    <option value="event">大會贊助</option>
                    <option value="title">冠名贊助</option>
                    <option value="track">賽道贊助</option>
                    <option value="venue">場地贊助</option>
                    <option value="prize">獎品贊助</option>
                    <option value="general">一般贊助</option>
                    <option value="other">其他贊助</option>
                  </select>
                </div>

                {/* 描述 */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    描述
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="輸入贊助商描述..."
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: '#d1d5db' }}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Logo 和 Icon 上傳 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      Logo (大圖)
                    </label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center" style={{ borderColor: '#d1d5db' }}>
                      {logoPreview ? (
                        <div className="relative">
                          <img src={logoPreview} alt="Logo Preview" className="max-h-32 mx-auto mb-2" />
                          <button
                            type="button"
                            onClick={() => {
                              setLogoFile(null);
                              setLogoPreview('');
                            }}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            移除
                          </button>
                        </div>
                      ) : (
                        <div>
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">點擊上傳 Logo</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="mt-2 text-sm"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Icon Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      Icon (小圖示)
                    </label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center" style={{ borderColor: '#d1d5db' }}>
                      {iconPreview ? (
                        <div className="relative">
                          <img src={iconPreview} alt="Icon Preview" className="max-h-32 mx-auto mb-2" />
                          <button
                            type="button"
                            onClick={() => {
                              setIconFile(null);
                              setIconPreview('');
                            }}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            移除
                          </button>
                        </div>
                      ) : (
                        <div>
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">點擊上傳 Icon</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleIconChange}
                        className="mt-2 text-sm"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {/* 其他文件上傳 */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    其他文件 (合約、簡報等)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleDocumentsChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    style={{ borderColor: '#d1d5db' }}
                    disabled={isSubmitting}
                  />
                  {documents.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{doc.name}</span>
                          <button
                            type="button"
                            onClick={() => removeDocument(index)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            移除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 聯絡資訊 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      聯絡人姓名
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      placeholder="例如: 張三"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ borderColor: '#d1d5db' }}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      聯絡人 Email
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      placeholder="例如: contact@example.com"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ borderColor: '#d1d5db' }}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* 網站 URL */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    網站 URL
                  </label>
                  <input
                    type="url"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleChange}
                    placeholder="例如: https://example.com"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: '#d1d5db' }}
                    disabled={isSubmitting}
                  />
                </div>

                {/* 管理者 */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    管理者
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    添加可管理此贊助商賽道的用戶（Email 必須已註冊）
                  </p>
                  
                  {/* 已添加的管理者列表 */}
                  {formData.managers.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {formData.managers.map((manager, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm" style={{ color: '#1a3a6e' }}>
                              {manager.name || manager.email}
                            </div>
                            <div className="text-xs text-gray-500">{manager.email}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveManager(index)}
                            disabled={isSubmitting}
                            className="px-3 py-1 text-sm rounded hover:bg-red-100 transition-colors"
                            style={{ color: '#dc2626' }}
                          >
                            移除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 添加管理者輸入 */}
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newManagerEmail}
                      onChange={(e) => setNewManagerEmail(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddManager();
                        }
                      }}
                      placeholder="輸入管理者 Email"
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ borderColor: '#d1d5db' }}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={handleAddManager}
                      disabled={isSubmitting || !newManagerEmail.trim()}
                      className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: '#1a3a6e',
                        color: 'white',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubmitting && newManagerEmail.trim()) {
                          e.currentTarget.style.backgroundColor = '#2a4a7e';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a3a6e';
                      }}
                    >
                      添加
                    </button>
                  </div>
                </div>

                {/* 消息提示 */}
                {message && (
                  <div
                    className={`p-4 rounded-lg ${
                      messageType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}
                  >
                    {message}
                  </div>
                )}

                {/* 提交按鈕 */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-lg font-semibold transition-colors"
                    style={{
                      backgroundColor: isSubmitting ? '#9ca3af' : '#1a3a6e',
                      color: '#ffffff',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.backgroundColor = '#2a4a7e';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.backgroundColor = '#1a3a6e';
                      }
                    }}
                  >
                    {isSubmitting ? '創建中...' : '創建贊助商'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sponsors 列表 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#1a3a6e' }}></div>
              <p className="text-base" style={{ color: '#6b7280' }}>載入贊助商列表...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-800">{error}</p>
            </div>
          ) : sponsors.length === 0 ? (
            <div
              className="rounded-lg p-12 text-center border-2 border-dashed"
              style={{ borderColor: '#d1d5db', backgroundColor: '#f9fafb' }}
            >
              <svg
                className="mx-auto mb-4 w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: '#9ca3af' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p className="text-lg font-medium mb-2" style={{ color: '#6b7280' }}>
                尚未添加贊助商
              </p>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                點擊上方「新增贊助商」按鈕來創建第一個贊助商
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border-2" style={{ borderColor: '#e5e7eb' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2" style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#374151' }}>
                        ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#374151' }}>
                        名稱
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#374151' }}>
                        等級
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#374151' }}>
                        聯絡人
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#374151' }}>
                        網站
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: '#374151' }}>
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sponsors.map((sponsor, index) => (
                      <tr
                        key={sponsor.id}
                        className="border-b"
                        style={{ borderColor: '#e5e7eb' }}
                      >
                        <td className="px-6 py-4 text-sm" style={{ color: '#1a3a6e' }}>
                          <code className="px-2 py-1 bg-gray-100 rounded text-xs">{sponsor.id}</code>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium" style={{ color: '#1a3a6e' }}>
                          {sponsor.name}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#6b7280' }}>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {sponsor.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#6b7280' }}>
                          {sponsor.contactEmail || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {sponsor.websiteUrl ? (
                            <a
                              href={sponsor.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              訪問
                            </a>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(sponsor)}
                              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
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
                              編輯
                            </button>
                            <button
                              onClick={() => handleDeleteClick(sponsor)}
                              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                              style={{
                                backgroundColor: '#991b1b',
                                color: '#ffffff',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#7f1d1d';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#991b1b';
                              }}
                            >
                              刪除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSponsor && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => !isDeleting && setShowDeleteModal(false)}
        >
          <div
            className="rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
            style={{ backgroundColor: '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: '#991b1b' }}>
              確認刪除
            </h2>

            <p className="text-base mb-4" style={{ color: '#374151' }}>
              確定要刪除贊助商「<strong>{selectedSponsor.name}</strong>」嗎？
            </p>

            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#fef2f2', borderLeft: '4px solid #991b1b' }}>
              <p className="text-sm" style={{ color: '#991b1b' }}>
                ⚠️ 此操作無法撤銷！
              </p>
              <p className="text-xs mt-1" style={{ color: '#7f1d1d' }}>
                如果此贊助商有關聯的賽道或挑戰，刪除將會失敗。
              </p>
            </div>

            {deleteMessage && (
              <div
                className="mb-4 p-3 rounded-md text-sm whitespace-pre-line"
                style={{
                  backgroundColor: deleteMessage.startsWith('✅') ? '#dcfce7' : '#fee2e2',
                  color: deleteMessage.startsWith('✅') ? '#166534' : '#991b1b',
                }}
              >
                {deleteMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) e.currentTarget.style.backgroundColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: '#991b1b',
                  color: '#ffffff',
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = '#7f1d1d';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#991b1b';
                }}
              >
                {isDeleting ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sponsor Modal */}
      {showEditModal && editingSponsor && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => !isEditing && setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                  編輯贊助商
                </h2>
                <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                  更新贊助商資料，包含品牌素材
                </p>
              </div>
              <button
                onClick={() => !isEditing && setShowEditModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                disabled={isEditing}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#6b7280' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Sponsor ID (不可編輯) */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  Sponsor ID
                </label>
                <input
                  type="text"
                  value={editingSponsor.id}
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                  style={{ borderColor: '#d1d5db', color: '#6b7280' }}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  贊助商名稱 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="例如：Oasis Protocol Foundation"
                  required
                  disabled={isEditing}
                />
              </div>

              {/* Tier */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  贊助等級
                </label>
                <select
                  value={editFormData.tier}
                  onChange={(e) => setEditFormData({ ...editFormData, tier: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: '#d1d5db' }}
                  disabled={isEditing}
                >
                  <option value="event">大會贊助</option>
                  <option value="title">冠名贊助</option>
                  <option value="track">賽道贊助</option>
                  <option value="venue">場地贊助</option>
                  <option value="prize">獎品贊助</option>
                  <option value="general">一般贊助</option>
                  <option value="other">其他贊助</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  描述
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="簡短描述贊助商..."
                  disabled={isEditing}
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
                  品牌Logo
                </label>
                <div className="space-y-2">
                  {editLogoPreview && (
                    <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden">
                      <img src={editLogoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditLogoChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={isEditing}
                  />
                  <p className="text-xs text-gray-500">上傳品牌Logo图片（PNG/JPG格式，最大2MB）</p>
                </div>
              </div>

              {/* KV Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
                  賽道KV图
                </label>
                <div className="space-y-2">
                  {editKvPreview && (
                    <div className="relative w-full max-w-md h-48 border-2 border-gray-200 rounded-lg overflow-hidden">
                      <img src={editKvPreview} alt="KV Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditKvChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    disabled={isEditing}
                  />
                  <p className="text-xs text-gray-500">上傳賽道宣傳主視覺图（PNG/JPG格式，最大5MB）</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    聯絡人姓名
                  </label>
                  <input
                    type="text"
                    value={editFormData.contactName}
                    onChange={(e) => setEditFormData({ ...editFormData, contactName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: '#d1d5db' }}
                    placeholder="例如：張三"
                    disabled={isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    聯絡人 Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.contactEmail}
                    onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: '#d1d5db' }}
                    placeholder="contact@example.com"
                    disabled={isEditing}
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  網站 URL
                </label>
                <input
                  type="url"
                  value={editFormData.websiteUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, websiteUrl: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="https://example.com"
                  disabled={isEditing}
                />
              </div>

              {/* 管理者 */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  管理者
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  添加可管理此贊助商賽道的用戶（Email 必須已註冊）
                </p>
                
                {/* 已添加的管理者列表 */}
                {editFormData.managers.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {editFormData.managers.map((manager, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm" style={{ color: '#1a3a6e' }}>
                            {manager.name || manager.email}
                          </div>
                          <div className="text-xs text-gray-500">{manager.email}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEditManager(index)}
                          disabled={isEditing}
                          className="px-3 py-1 text-sm rounded hover:bg-red-100 transition-colors"
                          style={{ color: '#dc2626' }}
                        >
                          移除
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 添加管理者輸入 */}
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={editNewManagerEmail}
                    onChange={(e) => setEditNewManagerEmail(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEditManager();
                      }
                    }}
                    placeholder="輸入管理者 Email"
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ borderColor: '#d1d5db' }}
                    disabled={isEditing}
                  />
                  <button
                    type="button"
                    onClick={handleAddEditManager}
                    disabled={isEditing || !editNewManagerEmail.trim()}
                    className="px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: '#1a3a6e',
                      color: 'white',
                    }}
                    onMouseEnter={(e) => {
                      if (!isEditing && editNewManagerEmail.trim()) {
                        e.currentTarget.style.backgroundColor = '#2a4a7e';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a3a6e';
                    }}
                  >
                    添加
                  </button>
                </div>
              </div>

              {/* Message */}
              {editMessage && (
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: editMessage.includes('✅') ? '#dcfce7' : '#fee2e2',
                    border: `1px solid ${editMessage.includes('✅') ? '#86efac' : '#fecaca'}`,
                    color: editMessage.includes('✅') ? '#166534' : '#991b1b',
                  }}
                >
                  {editMessage}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 rounded-lg font-medium border-2 transition-colors"
                  style={{
                    borderColor: '#d1d5db',
                    color: '#6b7280',
                  }}
                  disabled={isEditing}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: isEditing ? '#9ca3af' : '#1a3a6e',
                    color: '#ffffff',
                  }}
                  disabled={isEditing}
                >
                  {isEditing ? '更新中...' : '確認更新'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

