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
  const [calendarStatus, setCalendarStatus] = useState<'disconnected' | 'connected' | 'checking'>(
    'disconnected',
  );

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

            // 靜默連接，不顯示通知
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
      event.description ||
        '' + (event.speakers?.length ? `\n講者: ${event.speakers.join('、')}` : ''),
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

  const handleAddToCalendar = async (event: any, e: React.MouseEvent) => {
    e.preventDefault();

    // 檢查是否已連接 Google Calendar（直接連接）
    if (!googleAccessToken) {
      connectGoogleCalendar();
      return;
    }

    if (isEventAdded(event)) {
      // 如果已添加，靜默返回
      return;
    }

    // 使用 API 自動添加事件
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${googleAccessToken}`,
        },
        body: JSON.stringify({
          title: event.title,
          description:
            event.description ||
            '' + (event.speakers?.length ? `\n講者: ${event.speakers.join('、')}` : ''),
          location: event.location || '',
          startTime: event.startDate.toISOString(),
          endTime: event.endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token 失效
          throw new Error('授權已失效，請重新連接 Google Calendar');
        }
        const data = await response.json();
        throw new Error(data.error || '添加失敗');
      }

      const data = await response.json();

      // 標記為已添加
      markEventAsAdded(getEventId(event));

      // 靜默添加，不顯示通知
    } catch (error: any) {
      console.error('添加事件失敗:', error);

      if (error.message.includes('授權已失效')) {
        // 清除舊的 token
        setGoogleAccessToken(null);
        setCalendarStatus('disconnected');
        localStorage.removeItem('googleCalendarToken');

        const confirmReconnect = window.confirm(`${error.message}\n\n` + '點擊「確定」重新連接。');

        if (confirmReconnect) {
          connectGoogleCalendar();
        }
      } else {
        // 添加失敗，詢問是否使用傳統方式
        const useFallback = window.confirm(
          `自動添加失敗：${error.message}\n\n` + '是否改用傳統方式（開新視窗）添加？',
        );

        if (useFallback) {
          markEventAsAdded(getEventId(event));
          window.open(generateGoogleCalendarLink(event), '_blank');
        }
      }
    }
  };

  // Function to remove event from calendar
  const handleRemoveFromCalendar = async (event: any, e: React.MouseEvent) => {
    e.preventDefault();

    // 檢查是否已連接 Google Calendar（直接連接）
    if (!googleAccessToken) {
      connectGoogleCalendar();
      return;
    }

    if (!isEventAdded(event)) {
      return; // 靜默返回
    }

    const confirmRemove = window.confirm(`確定要從 Google Calendar 移除「${event.title}」嗎？`);

    if (!confirmRemove) {
      return;
    }

    try {
      // 注意：這裡需要實現 DELETE API，目前先移除本地標記
      removeEventFromAdded(getEventId(event));
      // 靜默移除，不顯示通知

      // TODO: 實現從 Google Calendar 刪除的 API
      // const response = await fetch(`/api/calendar/events/${eventId}`, {
      //   method: 'DELETE',
      //   headers: { 'Authorization': `Bearer ${googleAccessToken}` }
      // });
    } catch (error: any) {
      console.error('移除事件失敗:', error);
      alert(`移除失敗：${error.message}`);
    }
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
      alert(
        `連接失敗：${error.message}\n\n請確認後端已設置 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET 環境變數。`,
      );
    }
  };

  // Function to disconnect Google Calendar
  const disconnectGoogleCalendar = () => {
    const confirmDisconnect = window.confirm(
      '確定要斷開 Google Calendar 連接嗎？\n\n' + '斷開後需要重新授權才能檢查日曆。',
    );

    if (confirmDisconnect) {
      setGoogleAccessToken(null);
      setCalendarStatus('disconnected');
      setAddedEvents(new Set());
      setConflictingEvents(new Set());
      localStorage.removeItem('googleCalendarToken');
      localStorage.removeItem('googleCalendarRefreshToken');
      localStorage.removeItem('addedCalendarEvents');
      // 靜默斷開，不顯示通知
    }
  };

  // Function to check Google Calendar for added events and conflicts
  const checkGoogleCalendar = async () => {
    if (!googleAccessToken) {
      const confirmConnect = window.confirm(
        '需要連接 Google Calendar 才能檢查日曆。\n\n' + '點擊「確定」連接 Google Calendar。',
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
        `/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(
          timeMax,
        )}`,
        {
          headers: {
            Authorization: `Bearer ${googleAccessToken}`,
          },
        },
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
          `未添加：${
            sortedEvents.filter((e) => e.status !== 'unconfirmed').length -
            newAddedEvents.size -
            newConflicts.size
          } 個活動\n\n` +
          `按鈕顏色說明：\n` +
          `🟢 綠色 = 已添加\n` +
          `🔴 紅色 = 有衝突\n` +
          `🔵 藍色 = 可添加`,
      );
    } catch (error: any) {
      console.error('檢查日曆失敗:', error);

      if (error.message.includes('授權已失效')) {
        // 清除舊的 token
        setGoogleAccessToken(null);
        setCalendarStatus('disconnected');
        localStorage.removeItem('googleCalendarToken');

        const confirmReconnect = window.confirm(`${error.message}\n\n` + '點擊「確定」重新連接。');

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
          Authorization: token,
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
            </div>
          </div>

          {/* Google Calendar 連接卡片 */}
          {sortedEvents.length > 0 && (
            <div
              className="rounded-xl shadow-md p-6 mb-6"
              style={{ backgroundColor: '#f8f9fa', border: '1px solid #e1e4e8' }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Left side - Google Calendar info */}
                <div className="flex items-center gap-4">
                  {/* Google Calendar Icon */}
                  <div className="flex-shrink-0">
                    <div
                      className="w-14 h-14 rounded-lg flex items-center justify-center shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #5a6c7d 0%, #415261 100%)' }}
                    >
                      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
                      </svg>
                    </div>
                  </div>

                  {/* Status Info */}
                  <div className="flex-1">
                    {calendarStatus === 'disconnected' ? (
                      <>
                        <h3 className="text-lg font-bold mb-1" style={{ color: '#2c3e50' }}>
                          連接 Google Calendar
                        </h3>
                        <p className="text-sm" style={{ color: '#5a6c7d' }}>
                          自動添加活動到您的 Google Calendar，無需手動複製
                        </p>
                      </>
                    ) : calendarStatus === 'checking' ? (
                      <>
                        <h3
                          className="text-lg font-bold mb-1 flex items-center gap-2"
                          style={{ color: '#4a7ba7' }}
                        >
                          <svg
                            className="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          正在檢查日曆...
                        </h3>
                        <p className="text-sm" style={{ color: '#5a6c7d' }}>
                          正在比對您的 Google Calendar
                        </p>
                      </>
                    ) : (
                      <>
                        <h3
                          className="text-lg font-bold mb-1 flex items-center gap-2"
                          style={{ color: '#2d5a47' }}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          已連接 Google Calendar
                        </h3>
                        <p className="text-sm" style={{ color: '#5a6c7d' }}>
                          已添加 {addedEvents.size} 個活動
                          {conflictingEvents.size > 0 && ` • ${conflictingEvents.size} 個衝突`}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Right side - Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {/* 一鍵全加按鈕 - 始終顯示 */}
                  <button
                    onClick={async () => {
                      // 一鍵全加功能
                      if (!googleAccessToken) {
                        connectGoogleCalendar();
                        return;
                      }

                      const eventsToAdd = sortedEvents.filter(
                        (e) => e.status !== 'unconfirmed' && !isEventAdded(e),
                      );

                      if (eventsToAdd.length === 0) {
                        return; // 靜默處理，不顯示通知
                      }

                      const confirmAdd = window.confirm(
                        `確定要一次添加 ${eventsToAdd.length} 個活動到 Google Calendar 嗎？`,
                      );

                      if (!confirmAdd) return;

                      let successCount = 0;
                      let failCount = 0;

                      for (const event of eventsToAdd) {
                        try {
                          const response = await fetch('/api/calendar/events', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${googleAccessToken}`,
                            },
                            body: JSON.stringify({
                              title: event.title,
                              description:
                                event.description ||
                                '' +
                                  (event.speakers?.length
                                    ? `\n講者: ${event.speakers.join('、')}`
                                    : ''),
                              location: event.location || '',
                              startTime: event.startDate.toISOString(),
                              endTime: event.endDate.toISOString(),
                            }),
                          });

                          if (response.ok) {
                            markEventAsAdded(getEventId(event));
                            successCount++;
                          } else {
                            failCount++;
                          }
                        } catch (error) {
                          failCount++;
                        }
                      }

                      // 只在有失敗時才顯示提示
                      if (failCount > 0) {
                        alert(
                          `添加完成\n\n` + `成功：${successCount} 個\n` + `失敗：${failCount} 個`,
                        );
                      }
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
                  >
                    一鍵全加
                  </button>

                  {/* 根據狀態顯示不同的按鈕 */}
                  {calendarStatus === 'disconnected' ? (
                    <button
                      onClick={connectGoogleCalendar}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                      style={{
                        backgroundColor: '#5a6c7d',
                        color: 'white',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#4a5a6a';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#5a6c7d';
                      }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      連接 Google
                    </button>
                  ) : calendarStatus === 'checking' ? (
                    <button
                      disabled
                      className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
                      style={{
                        backgroundColor: '#e1e4e8',
                        color: '#9ca3af',
                      }}
                    >
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      檢查中...
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={checkGoogleCalendar}
                        disabled={isCheckingCalendar}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: '#4a7ba7',
                          color: 'white',
                        }}
                        onMouseEnter={(e) => {
                          if (!isCheckingCalendar) {
                            e.currentTarget.style.backgroundColor = '#3a6b97';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isCheckingCalendar) {
                            e.currentTarget.style.backgroundColor = '#4a7ba7';
                          }
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        {isCheckingCalendar ? '檢查中...' : '檢查日曆'}
                      </button>
                      <button
                        onClick={disconnectGoogleCalendar}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200"
                        style={{
                          backgroundColor: 'white',
                          color: '#5a6c7d',
                          border: '1px solid #d1d5db',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                        }}
                        title="斷開 Google Calendar 連接"
                      >
                        <svg
                          className="w-4 h-4"
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
                        斷開
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Connection Tips */}
              {calendarStatus === 'connected' && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid #d1d5db' }}>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2" style={{ color: '#5a6c7d' }}>
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: '#1a3a6e' }}
                      ></span>
                      <span>藍色 = 可添加</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: '#5a6c7d' }}>
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: '#2d5a47' }}
                      ></span>
                      <span>綠色 = 已添加</span>
                    </div>
                    <div className="flex items-center gap-2" style={{ color: '#5a6c7d' }}>
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: '#8B4049' }}
                      ></span>
                      <span>紅色 = 有衝突</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {sortedEvents.length === 0 ? (
          <div
            className="rounded-lg shadow-sm p-12 text-center"
            style={{ backgroundColor: '#e8eaed' }}
          >
            <p className="text-lg text-gray-500">目前沒有安排的活動</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEvents.map((event, index) => (
              <div
                key={index}
                className={`rounded-md shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border-l-4 ${
                  event.status === 'unconfirmed' ? 'opacity-60 grayscale' : ''
                } ${isAdmin ? 'cursor-pointer' : ''}`}
                style={{
                  backgroundColor: '#e8eaed',
                  borderLeftColor: '#1a3a6e',
                }}
                onClick={() => isAdmin && handleEditClick(event)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#d8dade';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#e8eaed';
                }}
              >
                <div className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    {/* Left side - Main info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {event.tags &&
                          event.tags.length > 0 &&
                          event.tags.map((tag: string, tagIndex: number) => (
                            <span
                              key={tagIndex}
                              className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getTagColor(
                                tag,
                              )}`}
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
                      {event.status !== 'unconfirmed' &&
                        (isEventAdded(event) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromCalendar(event, e);
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
                            title="從日曆移除"
                          >
                            − 移除
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
                            + 加入（有衝突）
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
                            + 加入
                          </button>
                        ))}
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
                    const tagsArray = editForm.tags
                      ? editForm.tags.split('、').filter((t) => t.trim())
                      : [];
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
                              newTags = tagsArray.filter((t) => t !== tag);
                            }
                            setEditForm({ ...editForm, tags: newTags.join('、') });
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getTagColor(
                            tag,
                          )}`}
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
