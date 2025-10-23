import * as React from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import firebase from 'firebase/app';
import 'firebase/auth';
import { RequestHelper } from '../../lib/request-helper';
import { useAuthContext } from '../../lib/user/AuthContext';
import CalendarIcon from '@material-ui/icons/CalendarToday';
import PinDrop from '@material-ui/icons/PinDrop';
import ClockIcon from '@material-ui/icons/AccessTime';
import PersonIcon from '@material-ui/icons/Person';
import ArrowBack from '@material-ui/icons/ArrowBack';
import ShareIcon from '@material-ui/icons/Share';
import AssignmentIcon from '@material-ui/icons/Assignment';

interface SingleEventPageProps {
  event: any;
  error?: string;
}

export default function SingleEventPage({ event, error }: SingleEventPageProps) {
  const router = useRouter();
  const { isSignedIn, user } = useAuthContext();
  const [copySuccess, setCopySuccess] = React.useState(false);
  const [showApplicationForm, setShowApplicationForm] = React.useState(false);
  const [definitekEmail, setDefinitekEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCheckingApplication, setIsCheckingApplication] = React.useState(false);
  const [applicationMessage, setApplicationMessage] = React.useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Check if this event requires application (specific event ID)
  const requiresApplication = event?.id === 'Elyt7SvclfTp43LPKmaq';

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold mb-4" style={{ color: '#1a3a6e' }}>
              找不到活動
            </h1>
            <p className="text-gray-600 mb-6">抱歉，此活動不存在或已被刪除。</p>
            <Link href="/schedule">
              <a
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-colors"
                style={{ backgroundColor: '#1a3a6e' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a4a7e')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1a3a6e')}
              >
                <ArrowBack style={{ fontSize: '20px' }} />
                返回時程表
              </a>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  const formatDate = (date: Date) => {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    return `${month}/${day}（${weekday}）`;
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const formatDateWithTime = (date: Date) => {
    return `${formatDate(date)} ${formatTime(date)}`;
  };

  const getDateTimeDisplay = () => {
    if (isSameDay(startDate, endDate)) {
      return {
        date: formatDate(startDate),
        time: `${formatTime(startDate)} - ${formatTime(endDate)}`,
      };
    } else {
      return {
        date: '',
        time: `${formatDateWithTime(startDate)} - ${formatDateWithTime(endDate)}`,
      };
    }
  };

  const { date, time } = getDateTimeDisplay();

  const getTagStyle = (tag: string) => {
    switch (tag) {
      case '熱門賽道':
        return { backgroundColor: '#8B4049' };
      case '技術':
        return { backgroundColor: '#1a3a6e' };
      case '黑客松':
        return { backgroundColor: '#5B4B8A' };
      case '組隊社交':
        return { backgroundColor: '#3D6B5C' };
      case '贊助商':
        return { backgroundColor: '#8B6239' };
      default:
        return { backgroundColor: '#4B5563' };
    }
  };

  const getLocationLink = (location: string) => {
    if (!location) return null;
    if (location.includes('imToken') || location.includes('羅斯福路二段 9 號')) {
      return 'https://www.google.com/maps/search/?api=1&query=台北市中正區羅斯福路二段9號9樓';
    } else if (location.includes('Sui Hub') || location.includes('信義路四段 380 號')) {
      return 'https://www.google.com/maps/place/%E5%B7%A5%E4%BD%9C%E6%A8%82+Working+Ler+%7C+%E5%85%B1%E6%83%B3%E7%A9%BA%E9%96%93+%E4%BF%A1%E7%BE%A9%E5%AE%89%E5%92%8C/@25.0328561,121.5558953,16.99z/data=!3m1!5s0x3442abcbe8a9e295:0xc9763f603da29e73!4m14!1m7!3m6!1s0x3442ab11c4af9bb3:0xea1a873f6bf98712!2z5bel5L2c5qiCIFdvcmtpbmcgTGVyIHwg5YWx5oOz56m66ZaTIOS_oee-qeWuieWSjA!8m2!3d25.0328524!4d121.5558986!16s%2Fg%2F11l288qq82!3m5!1s0x3442ab11c4af9bb3:0xea1a873f6bf98712!8m2!3d25.0328524!4d121.5558986!16s%2Fg%2F11l288qq82:entry=ttu&g_ep=EgoyMDI1MTAxMy4wIKXMDSoASAFQAw%3D%3D';
    }
    return null;
  };

  // Convert URLs in text to clickable links
  const linkifyText = (text: string) => {
    if (!text) return null;

    // Split by line breaks first
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
      // URL regex pattern
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = line.split(urlRegex);

      return (
        <React.Fragment key={lineIndex}>
          {parts.map((part, partIndex) => {
            // Check if this part is a URL
            if (urlRegex.test(part)) {
              return (
                <a
                  key={partIndex}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                  style={{ color: '#1a3a6e' }}
                >
                  {part}
                </a>
              );
            }
            return <span key={partIndex}>{part}</span>;
          })}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!definitekEmail.trim()) {
      setApplicationMessage({
        type: 'error',
        text: '請填寫「deFintek 線上課程網站」註冊信箱',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(definitekEmail)) {
      setApplicationMessage({
        type: 'error',
        text: '請填寫有效的電子郵件地址',
      });
      return;
    }

    setIsSubmitting(true);
    setApplicationMessage(null);

    try {
      // Get user token from Firebase Auth
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      console.log('[Application] Getting ID token...');
      const token = await currentUser.getIdToken();
      console.log('[Application] Token obtained');

      const response = await fetch('/api/event-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          definitekEmail: definitekEmail.trim(),
          userEmail: currentUser.email || '',
          userName:
            `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
            currentUser.email ||
            'Unknown',
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
        }),
      });

      const data = await response.json();

      console.log('[Application] Response status:', response.status);
      console.log('[Application] Response data:', data);

      if (response.ok) {
        setApplicationMessage({
          type: 'success',
          text: '申請已成功送出！我們已發送通知給主辦方。',
        });
        setDefinitekEmail('');
        setShowApplicationForm(false);
        setTimeout(() => {
          setApplicationMessage(null);
        }, 5000);
      } else {
        console.error('[Application] Error response:', data);
        setApplicationMessage({
          type: 'error',
          text: data.msg || `申請失敗 (${response.status})，請稍後再試`,
        });
      }
    } catch (error) {
      console.error('[Application] Submission error:', error);
      setApplicationMessage({
        type: 'error',
        text: `申請失敗：${error.message || '請稍後再試'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplicationClick = async () => {
    if (!isSignedIn || !user) {
      setApplicationMessage({
        type: 'info',
        text: '請先登入才能申請此活動',
      });
      setTimeout(() => {
        router.push('/auth');
      }, 2000);
      return;
    }

    // Check if user has already applied
    setIsCheckingApplication(true);
    setApplicationMessage(null);

    try {
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        setApplicationMessage({
          type: 'error',
          text: '請重新登入',
        });
        setIsCheckingApplication(false);
        return;
      }

      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/event-application?eventId=${event.id}&checkOnly=true`, {
        method: 'GET',
        headers: {
          Authorization: token,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hasApplied) {
          setApplicationMessage({
            type: 'info',
            text: '您已經申請過此活動',
          });
          setIsCheckingApplication(false);
          return;
        }
      }
    } catch (error) {
      console.error('[Application] Check error:', error);
      // Continue to show form even if check fails
    }

    setIsCheckingApplication(false);
    setShowApplicationForm(true);
    setApplicationMessage(null);
  };

  const generateGoogleCalendarLink = () => {
    const formatDateForGoogle = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    };

    const title = encodeURIComponent(event.title);
    const startTime = formatDateForGoogle(startDate);
    const endTime = formatDateForGoogle(endDate);

    const isOnlineEvent =
      event.location === '線上' || event.location?.toLowerCase().includes('online');
    const googleMeetLink = 'https://meet.google.com/xqk-afqm-sfw';

    let detailsText = event.description || '';
    if (event.speakers?.length) {
      detailsText += `\n講者: ${event.speakers.join('、')}`;
    }
    if (isOnlineEvent) {
      detailsText += `\n\n線上會議連結: ${googleMeetLink}`;
    }
    const details = encodeURIComponent(detailsText);

    const location = encodeURIComponent(isOnlineEvent ? googleMeetLink : event.location || '');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
  };

  const isPast = endDate < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-20">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/schedule">
            <a
              className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
              style={{ color: '#1a3a6e' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#2a4a7e')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1a3a6e')}
            >
              <ArrowBack style={{ fontSize: '18px' }} />
              返回時程表
            </a>
          </Link>
        </div>

        {/* 活动详情卡片 */}
        <div
          className={`rounded-lg shadow-lg overflow-hidden border-l-8 ${
            isPast ? 'opacity-60 grayscale' : ''
          }`}
          style={{
            backgroundColor: '#ffffff',
            borderLeftColor: '#1a3a6e',
          }}
        >
          <div className="p-8">
            {/* 类型标签 */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {event.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="inline-block px-3 py-1 rounded text-sm font-semibold text-white"
                    style={getTagStyle(tag)}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* 标题和状态 */}
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl font-bold" style={{ color: '#1a3a6e' }}>
                {event.title}
              </h1>
              {isPast && (
                <span className="inline-block px-3 py-1 rounded text-sm font-semibold bg-gray-500 text-white">
                  已結束
                </span>
              )}
            </div>

            {/* 日期时间 */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-gray-700">
              {date && (
                <div className="flex items-center gap-2">
                  <CalendarIcon style={{ fontSize: '20px', color: '#1a3a6e' }} />
                  <span className="text-lg">{date}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <ClockIcon style={{ fontSize: '20px', color: '#1a3a6e' }} />
                <span className="text-lg">{time}</span>
              </div>
            </div>

            {/* 地点 */}
            {event.location && (
              <div className="mb-6">
                <div className="flex items-center gap-2 text-gray-700">
                  <PinDrop style={{ fontSize: '20px', color: '#1a3a6e' }} />
                  {getLocationLink(event.location) ? (
                    <a
                      href={getLocationLink(event.location)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg hover:underline"
                      style={{ color: '#1a3a6e' }}
                    >
                      {event.location}
                    </a>
                  ) : (
                    <span className="text-lg">{event.location}</span>
                  )}
                </div>
                {/* 线上活动显示 Google Meet 链接 */}
                {(event.location === '線上' ||
                  event.location?.toLowerCase().includes('online')) && (
                  <div className="mt-2 ml-7">
                    <a
                      href="https://meet.google.com/xqk-afqm-sfw"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                      style={{ color: '#1a3a6e' }}
                    >
                      <span>📹</span>
                      <span>Google Meet: https://meet.google.com/xqk-afqm-sfw</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* 讲者 */}
            {event.speakers && event.speakers.length > 0 && (
              <div className="flex items-start gap-2 mb-6 text-gray-700">
                <PersonIcon style={{ fontSize: '20px', color: '#1a3a6e', marginTop: '2px' }} />
                <div className="text-lg">
                  <span className="font-semibold">講者：</span>
                  {event.speakers.join('、')}
                </div>
              </div>
            )}

            {/* 描述 */}
            {event.description && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3" style={{ color: '#1a3a6e' }}>
                  活動說明
                </h2>
                <div className="text-gray-700 leading-relaxed">
                  {linkifyText(event.description)}
                </div>
              </div>
            )}

            {/* 课程链接 - 仅显示给特定活动 */}
            {requiresApplication && (
              <div
                className="mb-6 p-6 rounded-lg border-2"
                style={{ borderColor: '#1a3a6e', backgroundColor: '#f0f4f8' }}
              >
                <h2 className="text-xl font-bold mb-3" style={{ color: '#1a3a6e' }}>
                  📚 課程資訊
                </h2>
                <p className="text-gray-700 mb-4">
                  此課程只免費提供給黑客松參賽者，完成報名後，您將可以訪問完整的課程內容。
                </p>
                <a
                  href="https://defintek.io/courses/solidity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-colors"
                  style={{ backgroundColor: '#1a3a6e' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a4a7e')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1a3a6e')}
                >
                  <span>🔗</span>
                  查看課程詳情
                </a>
              </div>
            )}

            {/* 消息提示 */}
            {applicationMessage && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  applicationMessage.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : applicationMessage.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-blue-50 border border-blue-200 text-blue-800'
                }`}
              >
                {applicationMessage.text}
              </div>
            )}

            {/* 申请表单 */}
            {requiresApplication && showApplicationForm && (
              <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-bold mb-4" style={{ color: '#1a3a6e' }}>
                  申請參加此活動
                </h3>
                <form onSubmit={handleApplicationSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      「deFintek 線上課程網站」註冊信箱 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={definitekEmail}
                      onChange={(e) => setDefinitekEmail(e.target.value)}
                      placeholder="請輸入您在 defintek.io 註冊的信箱"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                      disabled={isSubmitting}
                      required
                    />
                    <p className="mt-2 text-sm text-gray-600">
                      若尚未註冊，請先前往{' '}
                      <a
                        href="https://defintek.io/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:no-underline"
                        style={{ color: '#1a3a6e' }}
                      >
                        defintek.io
                      </a>{' '}
                      註冊帳號
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#1a3a6e' }}
                      onMouseEnter={(e) =>
                        !isSubmitting && (e.currentTarget.style.backgroundColor = '#2a4a7e')
                      }
                      onMouseLeave={(e) =>
                        !isSubmitting && (e.currentTarget.style.backgroundColor = '#1a3a6e')
                      }
                    >
                      {isSubmitting ? '送出中...' : '送出申請'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowApplicationForm(false);
                        setDefinitekEmail('');
                        setApplicationMessage(null);
                      }}
                      disabled={isSubmitting}
                      className="px-6 py-2 text-gray-700 font-semibold rounded-lg transition-colors border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      取消
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
              {requiresApplication && (
                <button
                  onClick={handleApplicationClick}
                  disabled={isCheckingApplication}
                  className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#8B4049' }}
                  onMouseEnter={(e) =>
                    !isCheckingApplication && (e.currentTarget.style.backgroundColor = '#9B5059')
                  }
                  onMouseLeave={(e) =>
                    !isCheckingApplication && (e.currentTarget.style.backgroundColor = '#8B4049')
                  }
                >
                  <AssignmentIcon style={{ fontSize: '20px' }} />
                  {isCheckingApplication ? '檢查中...' : '申請參加'}
                </button>
              )}

              <a
                href={generateGoogleCalendarLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-lg transition-colors"
                style={{ backgroundColor: '#1a3a6e' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a4a7e')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1a3a6e')}
              >
                <CalendarIcon style={{ fontSize: '20px' }} />
                加入日曆
              </a>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all duration-300 border-2"
                style={{
                  borderColor: copySuccess ? '#166534' : '#1a3a6e',
                  color: copySuccess ? 'white' : '#1a3a6e',
                  backgroundColor: copySuccess ? '#166534' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!copySuccess) {
                    e.currentTarget.style.backgroundColor = '#1a3a6e';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!copySuccess) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#1a3a6e';
                  }
                }}
              >
                <ShareIcon style={{ fontSize: '20px' }} />
                {copySuccess ? '✓ 已複製連結' : '複製活動連結'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  const protocol = context.req.headers.referer?.split('://')[0] || 'http';
  const host = context.req.headers.host || 'localhost:3009';
  const baseUrl = `${protocol}://${host}`;

  try {
    const { data: scheduleData } = await RequestHelper.get<ScheduleEvent[]>(
      `${baseUrl}/api/schedule`,
      {},
    );

    const event = scheduleData?.find((e: any) => e.id === id);

    if (!event) {
      return {
        props: {
          event: null,
          error: 'Event not found',
        },
      };
    }

    return {
      props: {
        event: {
          ...event,
          startDate: event.startDate || new Date().toISOString(),
          endDate: event.endDate || new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    console.error('Error fetching event:', error);
    return {
      props: {
        event: null,
        error: 'Failed to fetch event',
      },
    };
  }
};
