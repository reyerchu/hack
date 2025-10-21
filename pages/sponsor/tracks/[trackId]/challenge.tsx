/**
 * 挑戰編輯頁面
 * 
 * 允許贊助商編輯賽道的挑戰內容
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/storage';
import { useAuthContext } from '../../../../lib/user/AuthContext';
import { useIsSponsor } from '../../../../lib/sponsor/hooks';
import ChallengeEditor from '../../../../components/sponsor/ChallengeEditor';
import FileUpload from '../../../../components/sponsor/FileUpload';
import type { ExtendedChallenge, ChallengeAttachment } from '../../../../lib/sponsor/types';

export default function ChallengeEditPage() {
  const router = useRouter();
  const { trackId, challengeId } = router.query;
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const isSponsor = useIsSponsor();

  const [challenge, setChallenge] = useState<ExtendedChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 權限檢查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/sponsor/dashboard');
    } else if (!authLoading && isSignedIn && !isSponsor) {
      router.push('/');
    }
  }, [authLoading, isSignedIn, isSponsor, router]);

  // 獲取挑戰詳情
  useEffect(() => {
    // 檢查是否缺少必要參數
    if (!router.isReady) return;
    
    if (!trackId) return;
    
    if (!challengeId) {
      console.log('[ChallengeEdit] Missing challengeId, redirecting to track page');
      setError('缺少挑戰 ID 參數');
      setLoading(false);
      // 延遲重定向，讓用戶看到錯誤消息
      setTimeout(() => {
        router.push(`/sponsor/tracks/${trackId}`);
      }, 2000);
      return;
    }
    
    if (!isSignedIn) return;

    const fetchChallenge = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[ChallengeEdit] Fetching challenge:', { trackId, challengeId });

        // 安全获取 Firebase ID token
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
          throw new Error('無法獲取認證令牌');
        }
        const token = await currentUser.getIdToken();

        const response = await fetch(`/api/sponsor/tracks/${trackId}/challenge?challengeId=${challengeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('[ChallengeEdit] Response status:', response.status);

        if (!response.ok) {
          if (response.status === 404) {
            // 挑戰不存在
            throw new Error('找不到該挑戰');
          }
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch challenge');
        }

        const responseData = await response.json();
        console.log('[ChallengeEdit] Response data:', responseData);
        const challengeData = responseData.data || responseData;
        console.log('[ChallengeEdit] Challenge data:', challengeData);
        setChallenge(challengeData);
      } catch (err: any) {
        console.error('[ChallengeEdit] Error fetching challenge:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [router.isReady, trackId, challengeId, isSignedIn, router]);

  const handleSave = async (data: Partial<ExtendedChallenge>) => {
    try {
      setSaveSuccess(false);
      setError(null);

      console.log('[ChallengeEdit] Saving challenge:', { trackId, challengeId, data });

      // 安全获取 Firebase ID token
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        throw new Error('無法獲取認證令牌');
      }
      const token = await currentUser.getIdToken();

      const response = await fetch(`/api/sponsor/tracks/${trackId}/challenge?challengeId=${challengeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      console.log('[ChallengeEdit] Save response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save challenge');
      }

      const responseData = await response.json();
      console.log('[ChallengeEdit] Save response:', responseData);
      const updatedChallenge = responseData.data || responseData;
      console.log('[ChallengeEdit] Updated challenge:', updatedChallenge);
      setChallenge(updatedChallenge);
      setSaveSuccess(true);

      // 3秒后隐藏成功提示
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('[ChallengeEdit] Error saving challenge:', err);
      setError(err.message);
      throw err;
    }
  };

  const handleFileUpload = async (file: File, field: string) => {
    try {
      console.log('[ChallengeEdit] Uploading file:', file.name, 'for field:', field);
      
      // 生成唯一的文件名
      const timestamp = Date.now();
      const fileName = `challenges/${challengeId}/${field}/${timestamp}_${file.name}`;
      
      // 上傳到 Firebase Storage
      const storage = firebase.storage();
      const storageRef = storage.ref();
      const fileRef = storageRef.child(fileName);
      
      // 上傳文件
      const uploadTask = await fileRef.put(file);
      
      // 獲取下載 URL
      const downloadURL = await uploadTask.ref.getDownloadURL();
      
      console.log('[ChallengeEdit] File uploaded successfully:', downloadURL);
      
      // 更新挑戰的 attachments
      const currentAttachments = challenge?.attachments || [];
      const newAttachment: ChallengeAttachment = {
        name: file.name,
        url: downloadURL,
        type: 'pdf', // Default to pdf, can be customized based on file type
      };
      
      const updatedAttachments = [...currentAttachments, newAttachment];
      
      // 保存到數據庫
      await handleSave({ attachments: updatedAttachments });
      
      alert(`文件 "${file.name}" 上傳成功！`);
      
      return downloadURL;
    } catch (error: any) {
      console.error('[ChallengeEdit] Error uploading file:', error);
      alert(`文件上傳失敗：${error.message}`);
      throw error;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="h-96 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/sponsor/tracks/${trackId}`}>
            <a className="inline-flex items-center gap-1 text-sm font-medium mb-4 hover:underline" style={{ color: '#1a3a6e' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回賽道詳情
            </a>
          </Link>

          <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
            編輯挑戰內容
          </h1>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            设置挑戰的描述、要求、評分標准和獎金詳情
          </p>
        </div>

        {/* 成功提示 */}
        {saveSuccess && (
          <div
            className="mb-6 p-4 rounded-lg flex items-center gap-3"
            style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac' }}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#166534' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium" style={{ color: '#166534' }}>
              挑戰內容已成功保存
            </span>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div
            className="mb-6 p-4 rounded-lg"
            style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}
          >
            <p className="text-sm font-medium" style={{ color: '#991b1b' }}>
              {error}
            </p>
          </div>
        )}

        {/* 挑戰編輯器 */}
        <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
          <ChallengeEditor
            challenge={challenge || undefined}
            onSave={handleSave}
            loading={loading}
          />
        </div>

        {/* 文件上傳区域 */}
        <div className="rounded-lg p-6" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#1a3a6e' }}>
            挑戰附件
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
                挑戰简报 (PDF)
              </label>
              <FileUpload
                onFileSelect={(file) => handleFileUpload(file, 'challengeBrief')}
                acceptedTypes=".pdf"
                maxSizeMB={10}
                description="上傳详细的挑戰說明文檔（PDF格式，最大10MB）"
                currentFileName={challenge?.challengeBriefUrl ? '已上傳' : undefined}
                currentFileUrl={challenge?.challengeBriefUrl}
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

