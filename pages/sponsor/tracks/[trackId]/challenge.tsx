/**
 * 挑战编辑页面
 * 
 * 允许赞助商编辑赛道的挑战内容
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthContext } from '../../../../lib/user/AuthContext';
import { useIsSponsor } from '../../../../lib/sponsor/hooks';
import ChallengeEditor from '../../../../components/sponsor/ChallengeEditor';
import FileUpload from '../../../../components/sponsor/FileUpload';
import type { ExtendedChallenge } from '../../../../lib/sponsor/types';

export default function ChallengeEditPage() {
  const router = useRouter();
  const { trackId } = router.query;
  const { isSignedIn, loading: authLoading } = useAuthContext();
  const isSponsor = useIsSponsor();

  const [challenge, setChallenge] = useState<ExtendedChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 权限检查
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth?redirect=/sponsor/dashboard');
    } else if (!authLoading && isSignedIn && !isSponsor) {
      router.push('/');
    }
  }, [authLoading, isSignedIn, isSponsor, router]);

  // 获取挑战详情
  useEffect(() => {
    if (!trackId || !isSignedIn) return;

    const fetchChallenge = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await (window as any).firebase.auth().currentUser?.getIdToken();

        const response = await fetch(`/api/sponsor/tracks/${trackId}/challenge`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // 挑战不存在，创建空的初始数据
            setChallenge(null);
            setLoading(false);
            return;
          }
          throw new Error('Failed to fetch challenge');
        }

        const data = await response.json();
        setChallenge(data);
      } catch (err: any) {
        console.error('Error fetching challenge:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenge();
  }, [trackId, isSignedIn]);

  const handleSave = async (data: Partial<ExtendedChallenge>) => {
    try {
      setSaveSuccess(false);
      setError(null);

      const token = await (window as any).firebase.auth().currentUser?.getIdToken();

      const response = await fetch(`/api/sponsor/tracks/${trackId}/challenge`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save challenge');
      }

      const updatedChallenge = await response.json();
      setChallenge(updatedChallenge);
      setSaveSuccess(true);

      // 3秒后隐藏成功提示
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving challenge:', err);
      setError(err.message);
      throw err;
    }
  };

  const handleFileUpload = async (file: File, field: string) => {
    // TODO: 实现文件上传到云存储
    console.log('File upload:', file.name, 'for field:', field);
    alert('文件上传功能将在后续版本中实现');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/sponsor/tracks/${trackId}`}>
            <a className="inline-flex items-center gap-1 text-sm font-medium mb-4 hover:underline" style={{ color: '#1a3a6e' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回赛道详情
            </a>
          </Link>

          <h1 className="text-3xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
            编辑挑战内容
          </h1>
          <p className="text-sm" style={{ color: '#6b7280' }}>
            设置挑战的描述、要求、评分标准和奖金详情
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
              挑战内容已成功保存
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

        {/* 挑战编辑器 */}
        <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
          <ChallengeEditor
            challenge={challenge || undefined}
            onSave={handleSave}
            loading={loading}
          />
        </div>

        {/* 文件上传区域 */}
        <div className="rounded-lg p-6" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#1a3a6e' }}>
            挑战附件
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
                挑战简报 (PDF)
              </label>
              <FileUpload
                onFileSelect={(file) => handleFileUpload(file, 'challengeBrief')}
                acceptedTypes=".pdf"
                maxSizeMB={10}
                description="上传详细的挑战说明文档（PDF格式，最大10MB）"
                currentFileName={challenge?.challengeBriefUrl ? '已上传' : undefined}
                currentFileUrl={challenge?.challengeBriefUrl}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
                品牌Logo
              </label>
              <FileUpload
                onFileSelect={(file) => handleFileUpload(file, 'logo')}
                acceptedTypes="image/*"
                maxSizeMB={2}
                description="上传品牌Logo图片（PNG/JPG格式，最大2MB）"
                currentFileName={challenge?.brandAssets?.logoUrl ? '已上传' : undefined}
                currentFileUrl={challenge?.brandAssets?.logoUrl}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1a3a6e' }}>
                赛道KV图
              </label>
              <FileUpload
                onFileSelect={(file) => handleFileUpload(file, 'kv')}
                acceptedTypes="image/*"
                maxSizeMB={5}
                description="上传赛道宣传主视觉图（PNG/JPG格式，最大5MB）"
                currentFileName={challenge?.brandAssets?.kvImageUrl ? '已上传' : undefined}
                currentFileUrl={challenge?.brandAssets?.kvImageUrl}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

