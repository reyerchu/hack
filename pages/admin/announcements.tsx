/**
 * Admin Announcements & Questions Page
 * 
 * 管理公告和問題的頁面
 */

import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';
import AdminHeader from '../../components/adminComponents/AdminHeader';
import ErrorList from '../../components/ErrorList';
import SuccessCard from '../../components/adminComponents/SuccessCard';
import { useAuthContext } from '../../lib/user/AuthContext';
import { RequestHelper } from '../../lib/request-helper';
import { QADocument } from '../api/questions';

export function isAuthorized(user): boolean {
  if (!user || !user.permissions) return false;
  const permissions = user.permissions;
  return (
    permissions.includes('admin') ||
    permissions.includes('organizer') ||
    permissions.includes('super_admin') ||
    permissions[0] === 'admin' ||
    permissions[0] === 'super_admin'
  );
}

export default function AnnouncementsPage({ questions }: { questions: QADocument[] }) {
  const { user, isSignedIn } = useAuthContext();
  
  const [announcement, setAnnouncement] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);

  const addError = (errMsg: string) => {
    setErrors((prev) => [...prev, errMsg]);
  };

  const postAnnouncement = async () => {
    if (!user.permissions.includes('super_admin')) {
      alert('You do not have permission to perform this functionality');
      return;
    }
    try {
      await RequestHelper.post<Announcement, void>(
        '/api/announcements',
        {
          headers: {
            Authorization: user.token,
          },
        },
        {
          announcement,
        },
      );

      setShowSuccessMsg(true);
      setTimeout(() => {
        setShowSuccessMsg(false);
      }, 2000);
      setAnnouncement('');
    } catch (error) {
      addError('Failed to post announcement! Please try again later');
      console.log(error);
    }
  };

  if (!isSignedIn || !isAuthorized(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-5xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
            未授權
          </h1>
          <p className="text-base text-gray-600 mb-8">
            您沒有權限訪問此頁面
          </p>
          <Link href="/">
            <a
              className="inline-block border-2 px-8 py-3 text-sm font-medium uppercase tracking-wider transition-colors duration-300"
              style={{
                borderColor: '#1a3a6e',
                color: '#1a3a6e',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a3a6e';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#1a3a6e';
              }}
            >
              返回首頁
            </a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow">
      <Head>
        <title>公告與問題管理 - Admin Dashboard</title>
        <meta name="description" content="管理公告與問題" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-20">
          {/* Header */}
          <div className="mb-12">
            <h1
              className="text-4xl font-bold mb-2 text-left"
              style={{ color: '#1a3a6e' }}
            >
              管理儀表板
            </h1>
          </div>

          {/* Admin Tabs */}
          <AdminHeader />

          {/* Announcements Section */}
          {user.permissions.includes('super_admin') && (
            <div id="announcements" className="mb-12">
              <h2
                className="text-2xl font-bold mb-6"
                style={{ color: '#1a3a6e' }}
              >
                發布公告
              </h2>

              <ErrorList
                errors={errors}
                onClose={(idx: number) => {
                  const newErrorList = [...errors];
                  newErrorList.splice(idx, 1);
                  setErrors(newErrorList);
                }}
              />

              {showSuccessMsg && (
                <div className="my-2">
                  <SuccessCard msg="Announcement posted successfully" />
                </div>
              )}

              <div className="bg-white rounded-lg p-6 border-2" style={{ borderColor: '#e5e7eb' }}>
                <textarea
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="w-full rounded-xl p-4 text-base"
                  style={{ backgroundColor: '#F2F3FF' }}
                  placeholder="Type your announcement here"
                  rows={5}
                />
                <div className="flex flex-row justify-end my-4">
                  <button
                    type="button"
                    onClick={postAnnouncement}
                    className="py-2 px-5 rounded-lg font-bold text-white transition duration-300"
                    style={{ backgroundColor: '#1a3a6e' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a4a7e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1a3a6e')}
                  >
                    發布
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Questions Section */}
          <div id="questions" className="mb-12">
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: '#1a3a6e' }}
            >
              待處理問題
            </h2>

            {questions && questions.length > 0 ? (
              <div className="space-y-2">
                {questions.map((question, idx) => (
                  <Link key={idx} passHref href={`/admin/resolve/${question.id}`}>
                    <a className="block">
                      <div
                        className="bg-white rounded-lg p-4 border-2 hover:border-blue-500 transition-colors cursor-pointer"
                        style={{ borderColor: '#e5e7eb' }}
                      >
                        <p className="text-sm text-gray-700 font-medium">
                          {question.question}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                          <span>From: {(question as any).author || 'Anonymous'}</span>
                          {(question as any).timestamp && (
                            <span>
                              {new Date((question as any).timestamp).toLocaleDateString('zh-TW')}
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8 border-2 text-center" style={{ borderColor: '#e5e7eb' }}>
                <p className="text-base text-gray-600">目前沒有待處理的問題</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const protocol = context.req.headers.referer?.split('://')[0] || 'http';
  try {
    const { data } = await RequestHelper.get<QADocument[]>(
      `${protocol}://${context.req.headers.host}/api/questions/pending`,
      {},
    );
    return {
      props: {
        questions: data || [],
      },
    };
  } catch (error) {
    console.error('Error fetching questions:', error);
    return {
      props: {
        questions: [],
      },
    };
  }
};

