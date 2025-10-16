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
  const { profile, isSignedIn, user } = useAuthContext();
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
  const [selectedTagFilters, setSelectedTagFilters] = useState<Set<string>>(new Set());
  const [includeHistoryEvents, setIncludeHistoryEvents] = useState(false);

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

  // Filter events by date (hide past events unless includeHistoryEvents is true)
  const currentTime = new Date();
  const eventsByTime = includeHistoryEvents
    ? sortedEvents
    : sortedEvents.filter((event) => {
        const isPast = event.endDate < currentTime;
        if (isPast) {
          console.log(
            `Filtering out past event: ${event.title}, endDate: ${event.endDate}, current: ${currentTime}`,
          );
        }
        return event.endDate >= currentTime;
      });

  // Filter events by selected tags
  const filteredEvents =
    selectedTagFilters.size === 0
      ? eventsByTime
      : eventsByTime.filter((event) => {
          if (!event.tags || event.tags.length === 0) return false;
          return event.tags.some((tag: string) => selectedTagFilters.has(tag));
        });

  // Event type order for filtering
  const eventTypeOrder = ['黑客松', '贊助商', '組隊社交', '技術', '熱門賽道'];

  // Check if event is past
  const isPastEvent = (event: any) => event.endDate < currentTime;

  const formatDate = (date: Date) => {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    return `${month}/${day}（${weekday}）`;
  };

  // Check if two dates are on the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Format time in HH:mm format
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Format date with time in compact format: MM/DD（X）HH:mm
  const formatDateWithTime = (date: Date) => {
    return `${formatDate(date)} ${formatTime(date)}`;
  };

  // Smart datetime formatting for all cases
  const formatDateTime = (startDate: Date, endDate: Date) => {
    if (isSameDay(startDate, endDate)) {
      // Case 1: Same day event
      // Display: "10/31（四）" and "14:00 - 16:00"
      return {
        dateInfo: formatDate(startDate),
        timeInfo: `${formatTime(startDate)} - ${formatTime(endDate)}`,
        isMultiDay: false,
      };
    } else {
      // Case 2: Multi-day or overnight event
      // Display full datetime range: "10/31（四）22:00 - 11/1（五）02:00"
      return {
        dateInfo: '',
        timeInfo: `${formatDateWithTime(startDate)} - ${formatDateWithTime(endDate)}`,
        isMultiDay: true,
      };
    }
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
    } else if (location.includes('Sui Hub') || location.includes('信義路四段 380 號')) {
      return 'https://www.google.com/maps/place/%E5%B7%A5%E4%BD%9C%E6%A8%82+Working+Ler+%7C+%E5%85%B1%E6%83%B3%E7%A9%BA%E9%96%93+%E4%BF%A1%E7%BE%A9%E5%AE%89%E5%92%8C/@25.0328561,121.5558953,16.99z/data=!3m1!5s0x3442abcbe8a9e295:0xc9763f603da29e73!4m14!1m7!3m6!1s0x3442ab11c4af9bb3:0xea1a873f6bf98712!2z5bel5L2c5qiCIFdvcmtpbmcgTGVyIHwg5YWx5oOz56m66ZaTIOS_oee-qeWuieWSjA!8m2!3d25.0328524!4d121.5558986!16s%2Fg%2F11l288qq82!3m5!1s0x3442ab11c4af9bb3:0xea1a873f6bf98712!8m2!3d25.0328524!4d121.5558986!16s%2Fg%2F11l288qq82?entry=ttu&g_ep=EgoyMDI1MTAxMy4wIKXMDSoASAFQAw%3D%3D';
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

    // 檢查是否為線上活動
    const isOnlineEvent =
      event.location === '線上' || event.location?.toLowerCase().includes('online');
    const googleMeetLink = 'https://meet.google.com/xqk-afqm-sfw';

    // 構建 details，如果是線上活動則添加 Google Meet 連結
    let detailsText = event.description || '';
    if (event.speakers?.length) {
      detailsText += `\n講者: ${event.speakers.join('、')}`;
    }
    if (isOnlineEvent) {
      detailsText += `\n\n線上會議連結: ${googleMeetLink}`;
    }
    const details = encodeURIComponent(detailsText);

    // 如果是線上活動，location 使用 Google Meet 連結；否則使用原始地點
    const location = encodeURIComponent(isOnlineEvent ? googleMeetLink : event.location || '');

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

    // 檢查是否已經添加過
    if (isEventAdded(event)) {
      alert('此活動已經添加到您的日曆中');
      return;
    }

    // 使用傳統方式打開 Google Calendar
    window.open(generateGoogleCalendarLink(event), '_blank');

    // 標記為已添加
    markEventAsAdded(getEventId(event));
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

  // Function to convert Date to local datetime-local format (YYYY-MM-DDTHH:mm)
  const toLocalDateTimeString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
      startDate: toLocalDateTimeString(event.startDate),
      endDate: toLocalDateTimeString(event.endDate),
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

    // 立即输出所有认证状态信息
    console.clear();
    console.log('========================================');
    console.log('🔍 开始保存活动 - 认证状态检查');
    console.log('========================================');
    console.log('AuthContext 状态:');
    console.log('  - isSignedIn:', isSignedIn);
    console.log('  - user exists:', !!user);
    console.log('  - user.token exists:', !!user?.token);
    console.log('  - user.id:', user?.id || 'N/A');
    console.log('  - profile exists:', !!profile);
    console.log('');
    console.log('Firebase 状态:');
    console.log('  - firebase available:', !!(window as any).firebase);
    console.log('  - firebase.auth available:', !!(window as any).firebase?.auth);

    try {
      // Get fresh Firebase auth token (force refresh to avoid expiration)
      let token = '';
      let firebaseUser = null;

      try {
        // Wait for Firebase to be initialized
        if ((window as any).firebase?.auth) {
          firebaseUser = (window as any).firebase.auth().currentUser;
          console.log(
            '  - firebase.auth().currentUser (1st try):',
            firebaseUser ? `Found (${firebaseUser.email})` : 'null',
          );

          if (!firebaseUser) {
            // Wait a bit for auth state to load
            console.log('  - Waiting 500ms for auth state...');
            await new Promise((resolve) => setTimeout(resolve, 500));
            firebaseUser = (window as any).firebase.auth().currentUser;
            console.log(
              '  - firebase.auth().currentUser (2nd try):',
              firebaseUser ? `Found (${firebaseUser.email})` : 'null',
            );
          }

          if (firebaseUser) {
            console.log('');
            console.log('🔑 尝试获取 Firebase token...');
            try {
              // Force token refresh to get a fresh token (true = force refresh)
              token = await firebaseUser.getIdToken(true);
              console.log('✅ Token 获取成功！');
              console.log('   Token (前30字符):', token.substring(0, 30) + '...');
            } catch (tokenError) {
              console.error('❌ 获取 token 失败:', tokenError);
            }
          } else {
            console.log('');
            console.log('⚠️ Firebase user not found, 尝试 AuthContext token...');
            // Fallback: try to get from AuthContext
            token = user?.token || '';
            if (token) {
              console.log('✅ 从 AuthContext 获取到 token');
              console.log('   Token (前30字符):', token.substring(0, 30) + '...');
            } else {
              console.log('❌ AuthContext 也没有 token');
            }
          }
        } else {
          console.log('  - Firebase not available, using AuthContext token');
          token = user?.token || '';
          if (token) {
            console.log('✅ 从 AuthContext 获取到 token');
          }
        }
      } catch (error) {
        console.error('❌ Error in token retrieval process:', error);
        // Fallback to AuthContext token
        token = user?.token || '';
        if (token) {
          console.log('✅ 使用 AuthContext fallback token');
        }
      }

      if (!token) {
        const errorMsg =
          '無法獲取授權 token，請重新登入。\n\n請檢查：\n1. 您是否已登入？\n2. 請嘗試刷新頁面後重新登入。';
        console.error('========================================');
        console.error('❌ 保存失敗：無法獲取授權 token');
        console.error('========================================');
        console.error('詳細信息：');
        console.error('- Firebase user:', firebaseUser ? 'Found' : 'Not found');
        console.error('- User email:', firebaseUser?.email || 'N/A');
        console.error('- AuthContext user:', user ? 'Exists' : 'Not exists');
        console.error('- AuthContext token:', user?.token ? 'Exists' : 'Not exists');
        console.error('- isSignedIn:', isSignedIn);
        console.error('========================================');
        console.error('💡 請將此信息截圖或複製給開發者');
        console.error('========================================');
        alert(errorMsg);
        setIsSubmitting(false);
        return;
      }

      const isNewEvent = !editingEvent.title;
      const method = isNewEvent ? 'POST' : 'PUT';
      const successMessage = isNewEvent ? '活動新增成功！' : '活動更新成功！';

      console.log('Submitting event with token:', token ? '✓ Fresh token obtained' : '✗ No token');

      const response = await fetch('/api/schedule', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({
          ...editForm,
          id: editingEvent.id, // 傳遞 Firestore document ID
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
        // 獲取詳細錯誤信息
        const errorData = await response.json().catch(() => ({ msg: '未知錯誤' }));
        const errorMessage = isNewEvent ? '新增失敗' : '更新失敗';

        // 輸出詳細錯誤到控制台（可複製）
        console.error('========================================');
        console.error(`❌ ${errorMessage}`);
        console.error('========================================');
        console.error('狀態碼:', response.status);
        console.error('錯誤訊息:', errorData.msg || errorData.error || '未知錯誤');
        console.error('完整錯誤數據:', JSON.stringify(errorData, null, 2));
        console.error(
          '請求數據:',
          JSON.stringify(
            {
              title: editForm.title,
              Event: editForm.Event,
              startDate: editForm.startDate,
              endDate: editForm.endDate,
            },
            null,
            2,
          ),
        );
        console.error('========================================');
        console.error('💡 請複製以上信息並提供給開發者');
        console.error('========================================');

        alert(
          `${errorMessage}\n\n` +
            `狀態碼: ${response.status}\n` +
            `錯誤訊息: ${errorData.msg || errorData.error || '請稍後再試'}\n\n` +
            `詳細信息已輸出到瀏覽器控制台（按 F12 查看），\n` +
            `您可以從控制台複製錯誤信息。\n\n` +
            `請檢查：\n` +
            `1. 您是否有管理員權限？\n` +
            `2. 網路連接是否正常？\n` +
            `3. 所有必填欄位是否已填寫？`,
        );
      }
    } catch (error) {
      console.error('========================================');
      console.error('❌ 操作時發生錯誤');
      console.error('========================================');
      console.error('錯誤類型:', error.constructor.name);
      console.error('錯誤訊息:', error.message || error);
      console.error('完整錯誤:', error);
      console.error('Stack trace:', error.stack);
      console.error('========================================');
      console.error('💡 請複製以上信息並提供給開發者');
      console.error('========================================');

      alert(
        `操作時發生錯誤：\n\n${
          error.message || error
        }\n\n詳細錯誤信息已輸出到控制台（按 F12），您可以複製這些信息。`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle event deletion
  const handleDeleteEvent = async () => {
    if (!editingEvent?.title) {
      alert('無法刪除：這是新活動');
      return;
    }

    const confirmDelete = window.confirm(
      `確定要刪除此活動嗎？\n\n活動：${editingEvent.title}\n\n此操作無法撤銷！`,
    );

    if (!confirmDelete) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.clear();
      console.log('========================================');
      console.log('🗑️  開始刪除活動...');
      console.log('========================================');

      // Get fresh token
      let token = '';
      let firebaseUser = null;

      try {
        if ((window as any).firebase?.auth) {
          firebaseUser = (window as any).firebase.auth().currentUser;

          if (!firebaseUser) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            firebaseUser = (window as any).firebase.auth().currentUser;
          }

          if (firebaseUser) {
            token = await firebaseUser.getIdToken(true);
            console.log('✅ Firebase token 獲取成功');
          } else {
            token = user?.token || '';
            console.log('⚠️  使用 AuthContext token');
          }
        } else {
          token = user?.token || '';
          console.log('⚠️  使用 AuthContext token (Firebase 不可用)');
        }
      } catch (error) {
        console.error('❌ Error in token retrieval process:', error);
        token = user?.token || '';
      }

      if (!token) {
        const errorMsg = '無法獲取授權 token，請重新登入。';
        console.error('❌', errorMsg);
        alert(errorMsg);
        setIsSubmitting(false);
        return;
      }

      console.log('Deleting event:', {
        title: editingEvent.title,
      });

      const response = await fetch('/api/schedule', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({
          id: editingEvent.id, // 使用 document ID 删除
        }),
      });

      if (response.ok) {
        alert('活動已刪除！請刷新頁面查看更改。');
        setEditingEvent(null);
        window.location.reload();
      } else {
        const errorData = await response.json().catch(() => ({ msg: '未知錯誤' }));

        console.error('========================================');
        console.error('❌ 刪除失敗');
        console.error('========================================');
        console.error('狀態碼:', response.status);
        console.error('錯誤訊息:', errorData.msg || errorData.error || '未知錯誤');
        console.error('完整錯誤數據:', JSON.stringify(errorData, null, 2));
        console.error('========================================');

        alert(
          `刪除失敗：${
            errorData.msg || errorData.error || '未知錯誤'
          }\n\n詳細錯誤信息已輸出到瀏覽器控制台（F12）。`,
        );
      }
    } catch (error: any) {
      console.error('刪除失敗:', error);
      alert(`刪除失敗：${error.message}`);
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
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
                時程表
              </h1>
              <div className="text-sm text-gray-600 mb-3">
                <p>*所有活動時間均以台灣時間（GMT+8）為準</p>
                <p className="text-xs mt-1">
                  當前時間：{currentTime.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
                </p>
              </div>

              {/* 包含歷史活動選項 */}
              <div className="mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHistoryEvents}
                    onChange={(e) => setIncludeHistoryEvents(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-0 cursor-pointer"
                    style={{
                      accentColor: '#1a3a6e',
                    }}
                  />
                  <span className="text-sm font-medium" style={{ color: '#1a3a6e' }}>
                    包含所有歷史活動
                  </span>
                </label>
                {!includeHistoryEvents && sortedEvents.length !== eventsByTime.length && (
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    已隱藏 {sortedEvents.length - eventsByTime.length} 個已結束的活動
                  </p>
                )}
              </div>

              {/* 類型篩選按鈕 */}
              <div className="flex flex-wrap gap-2">
                {eventTypeOrder.map((tagType) => {
                  const isSelected = selectedTagFilters.has(tagType);
                  return (
                    <button
                      key={tagType}
                      onClick={() => {
                        const newFilters = new Set(selectedTagFilters);
                        if (isSelected) {
                          newFilters.delete(tagType);
                        } else {
                          newFilters.add(tagType);
                        }
                        setSelectedTagFilters(newFilters);
                      }}
                      className="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
                      style={
                        isSelected
                          ? { ...getTagStyle(tagType), color: 'white' }
                          : {
                              backgroundColor: '#e8eaed',
                              color: '#6b7280',
                              border: '1px solid #d1d5db',
                            }
                      }
                    >
                      {tagType}
                    </button>
                  );
                })}
                {selectedTagFilters.size > 0 && (
                  <button
                    onClick={() => setSelectedTagFilters(new Set())}
                    className="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      border: '1px solid #fecaca',
                    }}
                  >
                    清除篩選
                  </button>
                )}
              </div>
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
                      startDate: toLocalDateTimeString(startDate),
                      endDate: toLocalDateTimeString(endDate),
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
        </div>

        {/* 活動地點資訊 */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Google Meet 線上活動 */}
          <div
            className="rounded-lg shadow-md p-5 border-l-4"
            style={{
              backgroundColor: '#e8eef5',
              borderLeftColor: '#1a3a6e',
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <svg
                  className="w-6 h-6"
                  style={{ color: '#1a3a6e' }}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base mb-2" style={{ color: '#1a3a6e' }}>
                  線上活動 - Google Meet
                </h3>
                <p className="text-sm text-gray-600 mb-2">大多數線上工作坊將在此舉行</p>
                <a
                  href="https://meet.google.com/xqk-afqm-sfw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  style={{ color: '#8B0000' }}
                >
                  <span>進入會議室 (xqk-afqm-sfw)</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* imToken 實體活動 */}
          <div
            className="rounded-lg shadow-md p-5 border-l-4"
            style={{
              backgroundColor: '#e8eef5',
              borderLeftColor: '#1a3a6e',
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <PinDrop style={{ fontSize: '24px', color: '#1a3a6e' }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="font-bold text-base mb-2 flex items-center gap-2"
                  style={{ color: '#1a3a6e' }}
                >
                  <span>實體活動 -</span>
                  <img
                    src="/sponsor-media/imToken-logo.svg"
                    alt="imToken"
                    className="h-5 inline-block"
                    style={{ verticalAlign: 'middle' }}
                  />
                </h3>
                <p className="text-sm text-gray-600 mb-2">大多數實體工作坊將在此舉行</p>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=台北市中正區羅斯福路二段9號9樓"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  style={{ color: '#8B0000' }}
                >
                  <span>台北市中正區羅斯福路二段 9 號 9 樓</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div
            className="rounded-lg shadow-sm p-12 text-center"
            style={{ backgroundColor: '#e8eaed' }}
          >
            <p className="text-lg text-gray-500">
              {selectedTagFilters.size > 0 ? '沒有符合篩選條件的活動' : '目前沒有安排的活動'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event, index) => {
              const isEventPast = isPastEvent(event);
              return (
                <div
                  key={index}
                  className={`rounded-md shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border-l-4 ${
                    event.status === 'unconfirmed' || isEventPast ? 'opacity-60 grayscale' : ''
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
                            event.tags
                              .slice()
                              .sort((a: string, b: string) => {
                                const indexA = eventTypeOrder.indexOf(a);
                                const indexB = eventTypeOrder.indexOf(b);
                                // If tag not in order list, put it at the end
                                const orderA = indexA === -1 ? 999 : indexA;
                                const orderB = indexB === -1 ? 999 : indexB;
                                return orderA - orderB;
                              })
                              .map((tag: string, tagIndex: number) => (
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
                            {(() => {
                              const { dateInfo, timeInfo, isMultiDay } = formatDateTime(
                                event.startDate,
                                event.endDate,
                              );

                              if (isMultiDay) {
                                // Multi-day event: show full datetime range in one line
                                return (
                                  <div className="flex items-center gap-1">
                                    <ClockIcon style={{ fontSize: '14px' }} />
                                    <span>{timeInfo}</span>
                                  </div>
                                );
                              } else {
                                // Same day event: show date and time separately
                                return (
                                  <>
                                    <div className="flex items-center gap-1">
                                      <CalendarIcon style={{ fontSize: '14px' }} />
                                      <span>{dateInfo}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <ClockIcon style={{ fontSize: '14px' }} />
                                      <span>{timeInfo}</span>
                                    </div>
                                  </>
                                );
                              }
                            })()}
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
                          {isEventPast && (
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-gray-500 text-white">
                              已結束
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
                          <div className="text-xs opacity-90">
                            {event.startDate.getMonth() + 1}月
                          </div>
                        </div>
                        {event.status !== 'unconfirmed' &&
                          (hasConflict(event) ? (
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
                              + 日曆（有衝突）
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
                              + 日曆
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
                  {['黑客松', '贊助商', '組隊社交', '技術', '熱門賽道'].map((tag) => {
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
                {editingEvent?.title && (
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {isSubmitting ? '刪除中...' : '刪除'}
                  </button>
                )}
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
