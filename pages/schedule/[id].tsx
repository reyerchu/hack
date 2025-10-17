import * as React from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { RequestHelper } from '../../lib/request-helper';
import CalendarIcon from '@material-ui/icons/CalendarToday';
import PinDrop from '@material-ui/icons/PinDrop';
import ClockIcon from '@material-ui/icons/AccessTime';
import PersonIcon from '@material-ui/icons/Person';
import ArrowBack from '@material-ui/icons/ArrowBack';
import ShareIcon from '@material-ui/icons/Share';

interface SingleEventPageProps {
  event: any;
  error?: string;
}

export default function SingleEventPage({ event, error }: SingleEventPageProps) {
  const router = useRouter();
  const [copySuccess, setCopySuccess] = React.useState(false);

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

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
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
              <div className="flex items-center gap-2 mb-6 text-gray-700">
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
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
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
