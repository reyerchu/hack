import * as React from 'react';
import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { RequestHelper } from '../../lib/request-helper';
import { useAuthContext } from '../../lib/user/AuthContext';
import CalendarIcon from '@material-ui/icons/CalendarToday';
import PinDrop from '@material-ui/icons/PinDrop';
import ClockIcon from '@material-ui/icons/AccessTime';
import PersonIcon from '@material-ui/icons/Person';
import AddIcon from '@material-ui/icons/Add';
import EventAvailableIcon from '@material-ui/icons/EventAvailable';
import EditIcon from '@material-ui/icons/Edit';
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
      return 'Google Meet';
    } else if (location.includes('imToken')) {
      return '台北市中正區羅斯福路二段 9 號 9 樓';
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
  const handleAddToCalendar = (event: any, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isEventAdded(event)) {
      const confirmAdd = window.confirm(
        `您已經將「${event.title}」添加到日曆過了。\n確定要再次添加嗎？`,
      );
      if (!confirmAdd) {
        return;
      }
    }

    markEventAsAdded(getEventId(event));
    window.open(generateGoogleCalendarLink(event), '_blank');
  };

  // Function to add all events to Google Calendar
  const addAllToCalendar = () => {
    // Filter out unconfirmed and already added events
    const eventsToAdd = sortedEvents.filter(
      (event) => event.status !== 'unconfirmed' && !isEventAdded(event),
    );

    if (eventsToAdd.length === 0) {
      alert('所有已確認的活動都已經添加到日曆了！');
      return;
    }

    const confirmAdd = window.confirm(
      `準備添加 ${eventsToAdd.length} 個活動到 Google Calendar。\n（已跳過未確認及已添加的活動）\n\n確定繼續嗎？`,
    );

    if (!confirmAdd) {
      return;
    }

    eventsToAdd.forEach((event, index) => {
      setTimeout(() => {
        markEventAsAdded(getEventId(event));
        window.open(generateGoogleCalendarLink(event), '_blank');
      }, index * 500);
    });
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

      const response = await fetch('/api/schedule', {
        method: 'POST',
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
        alert('活動更新成功！請刷新頁面查看更改。');
        setEditingEvent(null);
        window.location.reload();
      } else {
        alert('更新失敗，請稍後再試。');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert('更新時發生錯誤。');
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
                時程表
              </h1>
              <p className="text-sm text-gray-600">*所有活動時間均以台灣時間（GMT+8）為準</p>
            </div>
            {sortedEvents.length > 0 && (
              <button
                onClick={addAllToCalendar}
                className="flex items-center gap-2 px-6 py-2.5 text-white rounded-md transition-all duration-200 font-semibold text-sm whitespace-nowrap shadow-md hover:shadow-lg hover:opacity-90"
                style={{
                  backgroundColor: '#4285F4',
                }}
              >
                <EventAvailableIcon style={{ fontSize: '20px' }} />
                全部加入日曆
              </button>
            )}
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
                className={`bg-white rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border-l-4 ${
                  event.status === 'unconfirmed' ? 'opacity-60 grayscale' : ''
                }`}
                style={{ borderLeftColor: '#1a3a6e' }}
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
                        <button
                          onClick={(e) => handleAddToCalendar(event, e)}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md hover:opacity-90"
                          style={{
                            backgroundColor: isEventAdded(event) ? '#34A853' : '#4285F4',
                          }}
                          title={isEventAdded(event) ? '已添加到日曆' : '加入日曆'}
                        >
                          {isEventAdded(event) ? (
                            <>
                              <EventAvailableIcon style={{ fontSize: '16px' }} />
                              已添加
                            </>
                          ) : (
                            <>
                              <AddIcon style={{ fontSize: '16px' }} />
                              加入日曆
                            </>
                          )}
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleEditClick(event)}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                          style={{
                            backgroundColor: '#f59e0b',
                            color: 'white',
                          }}
                        >
                          <EditIcon style={{ fontSize: '16px' }} />
                          編輯
                        </button>
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
                編輯活動
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
