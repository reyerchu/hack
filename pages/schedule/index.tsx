import * as React from 'react';
import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { RequestHelper } from '../../lib/request-helper';
import { useAuthContext } from '../../lib/user/AuthContext';
import CalendarIcon from '@material-ui/icons/CalendarToday';
import PinDrop from '@material-ui/icons/PinDrop';
import ClockIcon from '@material-ui/icons/AccessTime';
import PersonIcon from '@material-ui/icons/Person';
import CloseIcon from '@material-ui/icons/Close';

interface SchedulePageProps {
  scheduleCard: ScheduleEvent[];
}

export default function SchedulePage({ scheduleCard }: SchedulePageProps) {
  const { profile, isSignedIn } = useAuthContext();
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedEvents, setAddedEvents] = useState<Set<string>>(new Set());
  const [conflictingEvents, setConflictingEvents] = useState<Set<string>>(new Set());
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isCheckingCalendar, setIsCheckingCalendar] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState<'disconnected' | 'connected' | 'checking'>('disconnected');

  // Check if user is admin - must be signed in AND have admin permissions
  const isAdmin =
    isSignedIn &&
    profile?.user?.permissions &&
    (profile.user.permissions.includes('admin') ||
      profile.user.permissions.includes('super_admin'));

  // Load added events from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem('addedCalendarEvents');
    if (stored) {
      try {
        setAddedEvents(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error('Failed to load added events:', e);
      }
    }
  }, []);

  // Load Google Calendar token from localStorage
  React.useEffect(() => {
    const storedToken = localStorage.getItem('googleCalendarToken');
    if (storedToken) {
      setGoogleAccessToken(storedToken);
      setCalendarStatus('connected');
    }
  }, []);

  // Handle OAuth callback
  React.useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const authCode = urlParams.get('auth_code');
      const authError = urlParams.get('auth_error');

      if (authError) {
        alert(`授權失敗：${authError}`);
        // 清除 URL 參數
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (authCode) {
        try {
          // 交換授權碼獲取 token
          const response = await fetch('/api/calendar/auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: authCode }),
          });

          const data = await response.json();

          if (response.ok && data.tokens?.access_token) {
            // 存儲 token
            setGoogleAccessToken(data.tokens.access_token);
            setCalendarStatus('connected');
            localStorage.setItem('googleCalendarToken', data.tokens.access_token);
            
            // 如果有 refresh_token，也存儲（用於長期訪問）
            if (data.tokens.refresh_token) {
              localStorage.setItem('googleCalendarRefreshToken', data.tokens.refresh_token);
            }

            alert('Google Calendar 連接成功！\n現在可以檢查日曆了。');
          } else {
            throw new Error(data.error || '獲取 token 失敗');
          }
        } catch (error: any) {
          console.error('處理授權回調失敗:', error);
          alert(`連接失敗：${error.message}`);
        }

        // 清除 URL 參數
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleOAuthCallback();
  }, []);

  // Parse and normalize schedule data from server
  const events = Array.isArray(scheduleCard)
    ? scheduleCard.map((event) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
      }))
    : [];

  // Sort events by start date
  const sortedEvents = events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const formatDate = (date: Date) => {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    return `${month}/${day}（${weekday}）`;
  };

  const formatTime = (startDate: Date, endDate: Date) => {
    const formatHourMinute = (date: Date) => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    };
    return `${formatHourMinute(startDate)} - ${formatHourMinute(endDate)}`;
  };

  const getEventTypeLabel = (eventType: number) => {
    switch (eventType) {
      case 1:
        return '活動';
      case 2:
        return '贊助商';
      case 3:
        return '技術演講';
      case 4:
        return '工作坊';
      case 5:
        return '社交';
      default:
        return '活動';
    }
  };

  const getEventTypeColor = (eventType: number) => {
    switch (eventType) {
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-blue-600';
      case 4:
        return 'bg-purple-600';
      case 5:
        return 'bg-green-600';
      default:
        return 'bg-gray-500';
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case '熱門賽道':
        return 'text-white';
      case '技術':
        return 'text-white';
      case '黑客松':
        return 'text-white';
      case '組隊社交':
        return 'text-white';
      case '贊助商':
        return 'text-white';
      default:
        return 'bg-gray-700 text-white';
    }
  };

  const getTagStyle = (tag: string) => {
    switch (tag) {
      case '熱門賽道':
        return { backgroundColor: '#8B4049' }; // 暗紅
      case '技術':
        return { backgroundColor: '#1a3a6e' }; // 暗藍（與 Home page 一致）
      case '黑客松':
        return { backgroundColor: '#5B4B8A' }; // 暗紫
      case '組隊社交':
        return { backgroundColor: '#3D6B5C' }; // 暗綠
      case '贊助商':
        return { backgroundColor: '#8B6239' }; // 暗橙
      default:
        return { backgroundColor: '#4B5563' }; // 暗灰
    }
  };

  // Function to get location link
  const getLocationLink = (location: string) => {
    if (location === 'Google Meet' || location === '線上') {
      return 'https://meet.google.com/xqk-afqm-sfw';
    } else if (location === '台北市中正區羅斯福路二段 9 號 9 樓' || location.includes('imToken')) {
      return 'https://www.google.com/maps/search/?api=1&query=台北市中正區羅斯福路二段9號9樓';
    } else if (location.includes('Cozy Cowork Cafe')) {
      return 'https://www.google.com/maps/search/?api=1&query=Cozy+Cowork+Cafe+台北';
    } else if (location.includes('A747')) {
      return 'https://cpbae.nccu.edu.tw/cpbae-page/space/detail?id=157&date=2025-10-31';
    } else if (location.includes('A645')) {
      return 'https://cpbae.nccu.edu.tw/cpbae-page/space/detail?id=18&date=2025-11-01';
    }
    return null;
  };

  // Function to get location display name
  const getLocationDisplay = (location: string) => {
    if (location === '線上') {
      return '線上 Google Meet';
    } else if (location.includes('imToken')) {
      return 'imToken 台北市中正區羅斯福路二段 9 號 9 樓';
    } else if (location.includes('政大公企') && !location.includes('中心')) {
      return location.replace('政大公企', '政大公企中心');
    }
    return location;
  };

  // Function to generate unique event ID
  const getEventId = (event: any) => {
    return `${event.title}-${event.startDate.getTime()}`;
  };

  // Function to mark event as added
  const markEventAsAdded = (eventId: string) => {
    const newSet = new Set(addedEvents);
    newSet.add(eventId);
    setAddedEvents(newSet);
    localStorage.setItem('addedCalendarEvents', JSON.stringify(Array.from(newSet)));
  };

  // Function to check if event was added
  const isEventAdded = (event: any) => {
    return addedEvents.has(getEventId(event));
  };

  // Function to check if event has conflicts
  const hasConflict = (event: any) => {
    return conflictingEvents.has(getEventId(event));
  };

  // Function to generate Google Calendar link
  const generateGoogleCalendarLink = (event: any) => {
    const formatDateForGoogle = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    };

    const title = encodeURIComponent(event.title);
    const startTime = formatDateForGoogle(event.startDate);
    const endTime = formatDateForGoogle(event.endDate);
    const details = encodeURIComponent(
      event.description || '' + (event.speakers?.length ? `\n講者: ${event.speakers.join('、')}` : ''),
    );
    const location = encodeURIComponent(event.location || '');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
  };

  // Function to handle single event calendar add with duplicate check
  // Function to remove event from added list
  const removeEventFromAdded = (eventId: string) => {
    const newSet = new Set(addedEvents);
    newSet.delete(eventId);
    setAddedEvents(newSet);
    localStorage.setItem('addedCalendarEvents', JSON.stringify(Array.from(newSet)));
  };

  const handleAddToCalendar = (event: any, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isEventAdded(event)) {
      // 如果已添加，點擊後移除「已添加」狀態
      const confirmRemove = window.confirm(
        `「${event.title}」已標記為已添加。\n\n` +
        `點擊「確定」將移除已添加標記。\n` +
        `之後您可以重新加入日曆。`
      );
      if (confirmRemove) {
        removeEventFromAdded(getEventId(event));
      }
      return;
    }

    // 未添加的情況，正常添加
    markEventAsAdded(getEventId(event));
    window.open(generateGoogleCalendarLink(event), '_blank');
  };

  // Function to connect to Google Calendar
  const connectGoogleCalendar = async () => {
    try {
      const response = await fetch('/api/calendar/auth');
      const data = await response.json();

      if (response.ok && data.authUrl) {
        // 重定向到 Google 授權頁面
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || '獲取授權 URL 失敗');
      }
    } catch (error: any) {
      console.error('連接 Google Calendar 失敗:', error);
      alert(`連接失敗：${error.message}\n\n請確認後端已設置 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET 環境變數。`);
    }
  };

  // Function to disconnect Google Calendar
  const disconnectGoogleCalendar = () => {
    const confirmDisconnect = window.confirm(
      '確定要斷開 Google Calendar 連接嗎？\n\n' +
      '斷開後需要重新授權才能檢查日曆。'
    );

    if (confirmDisconnect) {
      setGoogleAccessToken(null);
      setCalendarStatus('disconnected');
      setAddedEvents(new Set());
      setConflictingEvents(new Set());
      localStorage.removeItem('googleCalendarToken');
      localStorage.removeItem('googleCalendarRefreshToken');
      localStorage.removeItem('addedCalendarEvents');
      alert('已斷開 Google Calendar 連接。');
    }
  };

  // Function to check Google Calendar for added events and conflicts
  const checkGoogleCalendar = async () => {
    if (!googleAccessToken) {
      const confirmConnect = window.confirm(
        '需要連接 Google Calendar 才能檢查日曆。\n\n' +
        '點擊「確定」連接 Google Calendar。'
      );
      if (confirmConnect) {
        connectGoogleCalendar();
      }
      return;
    }

    setIsCheckingCalendar(true);
    setCalendarStatus('checking');

    try {
      // 獲取時間範圍（從最早的活動到最晚的活動）
      const earliestEvent = sortedEvents[0];
      const latestEvent = sortedEvents[sortedEvents.length - 1];
      
      if (!earliestEvent || !latestEvent) {
        alert('沒有活動需要檢查。');
        return;
      }

      const timeMin = earliestEvent.startDate.toISOString();
      const timeMax = latestEvent.endDate.toISOString();

      // 調用 API 獲取 Google Calendar 事件
      const response = await fetch(
        `/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
        {
          headers: {
            Authorization: `Bearer ${googleAccessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('授權已失效，請重新連接 Google Calendar');
        }
        const data = await response.json();
        throw new Error(data.error || '獲取日曆事件失敗');
      }

      const data = await response.json();
      const calendarEvents = data.events || [];

      // 比對活動
      const newAddedEvents = new Set<string>();
      const newConflicts = new Set<string>();

      sortedEvents.forEach((localEvent) => {
        if (localEvent.status === 'unconfirmed') return;

        const localStart = localEvent.startDate.getTime();
        const localEnd = localEvent.endDate.getTime();
        let foundExactMatch = false;
        let hasConflict = false;

        calendarEvents.forEach((calEvent: any) => {
          const calStart = new Date(calEvent.start?.dateTime || calEvent.start?.date).getTime();
          const calEnd = new Date(calEvent.end?.dateTime || calEvent.end?.date).getTime();

          // 檢查是否完全匹配（標題相同且時間重疊超過80%）
          const titleMatch =
            calEvent.summary?.includes(localEvent.title) ||
            localEvent.title.includes(calEvent.summary || '');

          const overlapStart = Math.max(localStart, calStart);
          const overlapEnd = Math.min(localEnd, calEnd);
          const overlapDuration = Math.max(0, overlapEnd - overlapStart);
          const localDuration = localEnd - localStart;
          const overlapPercentage = overlapDuration / localDuration;

          if (titleMatch && overlapPercentage > 0.8) {
            foundExactMatch = true;
          } else if (overlapDuration > 0) {
            // 有時間重疊但不是同一個活動
            hasConflict = true;
          }
        });

        if (foundExactMatch) {
          newAddedEvents.add(getEventId(localEvent));
        } else if (hasConflict) {
          newConflicts.add(getEventId(localEvent));
        }
      });

      // 更新狀態
      setAddedEvents(newAddedEvents);
      setConflictingEvents(newConflicts);
      setCalendarStatus('connected');

      // 保存到 localStorage
      localStorage.setItem('addedCalendarEvents', JSON.stringify(Array.from(newAddedEvents)));

      // 顯示結果
      alert(
        `檢查完成！\n\n` +
        `已添加：${newAddedEvents.size} 個活動\n` +
        `時間衝突：${newConflicts.size} 個活動\n` +
        `未添加：${sortedEvents.filter(e => e.status !== 'unconfirmed').length - newAddedEvents.size - newConflicts.size} 個活動\n\n` +
        `按鈕顏色說明：\n` +
        `🟢 綠色 = 已添加\n` +
        `🔴 紅色 = 有衝突\n` +
        `🔵 藍色 = 可添加`
      );
    } catch (error: any) {
      console.error('檢查日曆失敗:', error);
      
      if (error.message.includes('授權已失效')) {
        // 清除舊的 token
        setGoogleAccessToken(null);
        setCalendarStatus('disconnected');
        localStorage.removeItem('googleCalendarToken');
        
        const confirmReconnect = window.confirm(
          `${error.message}\n\n` +
          '點擊「確定」重新連接。'
        );
        
        if (confirmReconnect) {
          connectGoogleCalendar();
        }
      } else {
        alert(`檢查失敗：${error.message}`);
      }
    } finally {
      setIsCheckingCalendar(false);
      if (calendarStatus === 'checking') {
        setCalendarStatus('connected');
      }
    }
  };

  // Function to handle edit button click
  const handleEditClick = (event: any) => {
    setEditingEvent(event);
    setEditForm({
      title: event.title,
      description: event.description,
      location: event.location,
      speakers: event.speakers?.join('、') || '',
      tags: event.tags?.join('、') || '',
      startDate: event.startDate.toISOString().slice(0, 16),
      endDate: event.endDate.toISOString().slice(0, 16),
      Event: event.Event,
      track: event.track,
      page: event.page,
      status: event.status || 'confirmed',
    });
  };

  // Function to handle form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get Firebase auth token
      const user = await (window as any).firebase?.auth()?.currentUser;
      const token = user ? await user.getIdToken() : '';

      const isNewEvent = !editingEvent.title;
      const method = isNewEvent ? 'POST' : 'PUT';
      const successMessage = isNewEvent ? '活動新增成功！' : '活動更新成功！';

      const response = await fetch('/api/schedule', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify({
          ...editForm,
          speakers: editForm.speakers.split('、').filter((s: string) => s.trim()),
          tags: editForm.tags ? editForm.tags.split('、').filter((t: string) => t.trim()) : [],
          startDate: new Date(editForm.startDate).toISOString(),
          endDate: new Date(editForm.endDate).toISOString(),
        }),
      });

      if (response.ok) {
        alert(successMessage + '請刷新頁面查看更改。');
        setEditingEvent(null);
        window.location.reload();
      } else {
        alert(isNewEvent ? '新增失敗，請稍後再試。' : '更新失敗，請稍後再試。');
      }
    } catch (error) {
      console.error('Error submitting event:', error);
      alert('操作時發生錯誤。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to render description with clickable links
  const renderDescription = (description: string) => {
    if (!description) return null;

    const lines = description.split('\n');
    return lines.map((line, index) => {
      const urlMatch = line.match(/(https?:\/\/[^\s]+)/g);
      if (urlMatch) {
        const parts = line.split(/(https?:\/\/[^\s]+)/g);
        return (
          <p key={index} className="mb-1">
            {parts.map((part, i) => {
              if (part.match(/^https?:\/\//)) {
                return (
                  <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {part}
                  </a>
                );
              }
              return <span key={i}>{part}</span>;
            })}
          </p>
        );
      }
      return (
        <p key={index} className="mb-1">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
                時程表
              </h1>
              <p className="text-sm text-gray-600">*所有活動時間均以台灣時間（GMT+8）為準</p>
            </div>
            <div className="flex flex-col gap-3">
              {isAdmin && (
                <button
                  onClick={() => {
                    const now = new Date();
                    const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 明天
                    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2小時後
                    
                    setEditForm({
                      title: '',
                      startDate: startDate.toISOString().slice(0, 16),
                      endDate: endDate.toISOString().slice(0, 16),
                      location: '線上',
                      speakers: '',
                      description: '',
                      Event: 3,
                      status: 'confirmed',
                      tags: '',
                    });
                    setEditingEvent({} as any); // 空物件表示新增
                  }}
                  className="border-2 px-6 py-2.5 text-sm font-medium tracking-wide transition-colors duration-300 whitespace-nowrap"
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
                  + 新增活動
                </button>
              )}
              {sortedEvents.length > 0 && (
                <>
                  {calendarStatus === 'disconnected' ? (
                    <button
                      onClick={connectGoogleCalendar}
                      className="border-2 px-6 py-2.5 text-sm font-medium tracking-wide transition-colors duration-300 whitespace-nowrap"
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
                      連接 Google Calendar
                    </button>
                  ) : calendarStatus === 'checking' ? (
                    <button
                      disabled
                      className="border-2 px-6 py-2.5 text-sm font-medium tracking-wide whitespace-nowrap opacity-60"
                      style={{
                        borderColor: '#1a3a6e',
                        color: '#1a3a6e',
                        backgroundColor: 'transparent',
                      }}
                    >
                      檢查中...
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={checkGoogleCalendar}
                        className="border-2 px-6 py-2.5 text-sm font-medium tracking-wide transition-colors duration-300 whitespace-nowrap"
                        style={{
                          borderColor: '#3D6B5C',
                          color: '#3D6B5C',
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#3D6B5C';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#3D6B5C';
                        }}
                        disabled={isCheckingCalendar}
                      >
                        {isCheckingCalendar ? '檢查中...' : '檢查日曆'}
                      </button>
                      <button
                        onClick={disconnectGoogleCalendar}
                        className="border-2 px-4 py-2.5 text-xs font-medium tracking-wide transition-colors duration-300 whitespace-nowrap"
                        style={{
                          borderColor: '#8B4049',
                          color: '#8B4049',
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#8B4049';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#8B4049';
                        }}
                        title="斷開 Google Calendar 連接"
                      >
                        斷開連接
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {sortedEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-lg text-gray-500">目前沒有安排的活動</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEvents.map((event, index) => (
              <div
                key={index}
                className={`bg-white rounded-md shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border-l-4 ${
                  event.status === 'unconfirmed' ? 'opacity-60 grayscale' : ''
                } ${isAdmin ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-blue-50'}`}
                style={{ borderLeftColor: '#1a3a6e' }}
                onClick={() => isAdmin && handleEditClick(event)}
              >
                <div className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    {/* Left side - Main info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {event.tags && event.tags.length > 0 && event.tags.map((tag: string, tagIndex: number) => (
                          <span
                            key={tagIndex}
                            className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getTagColor(tag)}`}
                            style={getTagStyle(tag)}
                          >
                            {tag}
                          </span>
                        ))}

                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <CalendarIcon style={{ fontSize: '14px' }} />
                            <span>{formatDate(event.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon style={{ fontSize: '14px' }} />
                            <span>{formatTime(event.startDate, event.endDate)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Title with Status */}
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-lg font-bold" style={{ color: '#1a3a6e' }}>
                          {event.title}
                        </h2>
                        {event.status === 'unconfirmed' && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-gray-400 text-white">
                            未確認
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700 mb-2">
                        <div className="flex items-center gap-1">
                          <PinDrop style={{ fontSize: '16px' }} className="text-gray-500" />
                          {getLocationLink(event.location) ? (
                            <a
                              href={getLocationLink(event.location)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                              style={{ color: '#1a3a6e' }}
                            >
                              {getLocationDisplay(event.location) || '待定'}
                            </a>
                          ) : (
                            <span>{getLocationDisplay(event.location) || '待定'}</span>
                          )}
                        </div>

                        {event.speakers && event.speakers.length > 0 && (
                          <div className="flex items-center gap-1">
                            <PersonIcon style={{ fontSize: '16px' }} className="text-gray-500" />
                            <span>{event.speakers.join('、')}</span>
                          </div>
                        )}
                      </div>

                      {event.description && (
                        <div className="text-sm text-gray-600">
                          {renderDescription(event.description)}
                        </div>
                      )}
                    </div>

                    {/* Right side - Compact date display and buttons */}
                    <div className="md:text-right flex-shrink-0 flex flex-col gap-2">
                      <div
                        className="rounded-md px-4 py-2 text-white text-center"
                        style={{ backgroundColor: '#1a3a6e' }}
                      >
                        <div className="text-2xl font-bold">{event.startDate.getDate()}</div>
                        <div className="text-xs opacity-90">{event.startDate.getMonth() + 1}月</div>
                      </div>
            {event.status !== 'unconfirmed' && (
              isEventAdded(event) ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCalendar(event, e);
                  }}
                  className="border-2 px-3 py-1.5 text-xs font-medium tracking-wide whitespace-nowrap"
                  style={{
                    borderColor: '#3D6B5C',
                    color: '#3D6B5C',
                    backgroundColor: 'transparent',
                  }}
                  title="已添加到日曆"
                >
                  ✓ 已添加
                </button>
              ) : hasConflict(event) ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCalendar(event, e);
                  }}
                  className="border-2 px-3 py-1.5 text-xs font-medium tracking-wide transition-colors duration-300 whitespace-nowrap"
                  style={{
                    borderColor: '#8B4049',
                    color: '#8B4049',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#8B4049';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#8B4049';
                  }}
                  title="有時間衝突"
                >
                  + 加入日曆（有衝突）
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCalendar(event, e);
                  }}
                  className="border-2 px-3 py-1.5 text-xs font-medium tracking-wide transition-colors duration-300 whitespace-nowrap"
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
                  title="加入日曆"
                >
                  + 加入日曆
                </button>
              )
            )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div
              className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center"
              style={{ borderBottomColor: '#1a3a6e' }}
            >
              <h2 className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
                {editingEvent.title ? '編輯活動' : '新增活動'}
              </h2>
              <button
                onClick={() => setEditingEvent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#1a3a6e' }}>
                  活動標題
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#1a3a6e' }}>
                    開始時間
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#1a3a6e' }}>
                    結束時間
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#1a3a6e' }}>
                  地點
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#1a3a6e' }}>
                  講者（用「、」分隔）
                </label>
                <input
                  type="text"
                  value={editForm.speakers}
                  onChange={(e) => setEditForm({ ...editForm, speakers: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：Reyer、Ping"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#1a3a6e' }}>
                  類型（可多選）
                </label>
                <div className="space-y-2">
                  {['熱門賽道', '技術', '黑客松', '組隊社交', '贊助商'].map((tag) => {
                    const tagsArray = editForm.tags ? editForm.tags.split('、').filter(t => t.trim()) : [];
                    const isChecked = tagsArray.includes(tag);
                    
                    return (
                      <label key={tag} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let newTags: string[];
                            if (e.target.checked) {
                              newTags = [...tagsArray, tag];
                            } else {
                              newTags = tagsArray.filter(t => t !== tag);
                            }
                            setEditForm({ ...editForm, tags: newTags.join('、') });
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span 
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getTagColor(tag)}`}
                          style={getTagStyle(tag)}
                        >
                          {tag}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#1a3a6e' }}>
                  活動描述
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: '#1a3a6e' }}>
                  活動狀態
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="confirmed">已確認</option>
                  <option value="unconfirmed">未確認</option>
                </select>
            </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-2.5 text-white rounded-md font-semibold transition-opacity duration-200 disabled:opacity-50"
                  style={{ backgroundColor: '#1a3a6e' }}
                >
                  {isSubmitting ? '儲存中...' : '儲存變更'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-6 py-2.5 bg-gray-300 text-gray-700 rounded-md font-semibold hover:bg-gray-400 transition-colors duration-200"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const protocol = context.req.headers.referer?.split('://')[0] || 'http';
  const host = context.req.headers.host || 'localhost:3009';
  const baseUrl = `${protocol}://${host}`;

  try {
  const { data: scheduleData } = await RequestHelper.get<ScheduleEvent[]>(
    `${baseUrl}/api/schedule`,
    {},
  );
  return {
    props: {
        scheduleCard: scheduleData || [],
      },
    };
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return {
      props: {
        scheduleCard: [],
      },
    };
  }
};
