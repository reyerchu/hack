import * as React from 'react';
import { GetServerSideProps } from 'next';
import { RequestHelper } from '../../lib/request-helper';
import CalendarIcon from '@material-ui/icons/CalendarToday';
import PinDrop from '@material-ui/icons/PinDrop';
import ClockIcon from '@material-ui/icons/AccessTime';
import PersonIcon from '@material-ui/icons/Person';

interface SchedulePageProps {
  scheduleCard: ScheduleEvent[];
}

export default function SchedulePage({ scheduleCard }: SchedulePageProps) {
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

  // Function to render description with clickable links
  const renderDescription = (description: string) => {
    if (!description) return null;

    // Split by lines and check for URLs
    const lines = description.split('\n');
    return lines.map((line, index) => {
      // Check if line contains a URL
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
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
            時程表
          </h1>
          <p className="text-sm text-gray-600">*所有活動時間均以台灣時間（GMT+8）為準</p>
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
                className="bg-white rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border-l-4"
                style={{ borderLeftColor: '#1a3a6e' }}
              >
                <div className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    {/* Left side - Main info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Event type badge */}
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold text-white ${getEventTypeColor(
                            event.Event,
                          )}`}
                        >
                          {getEventTypeLabel(event.Event)}
                        </span>

                        {/* Date and time in one line */}
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

                      {/* Title */}
                      <h2 className="text-lg font-bold mb-2" style={{ color: '#1a3a6e' }}>
                        {event.title}
                      </h2>

                      {/* Location and speakers in one line */}
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700 mb-2">
                        <div className="flex items-center gap-1">
                          <PinDrop style={{ fontSize: '16px' }} className="text-gray-500" />
                          <span>{event.location || '待定'}</span>
                        </div>

                        {event.speakers && event.speakers.length > 0 && (
                          <div className="flex items-center gap-1">
                            <PersonIcon style={{ fontSize: '16px' }} className="text-gray-500" />
                            <span>{event.speakers.join('、')}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {event.description && (
                        <div className="text-sm text-gray-600">
                          {renderDescription(event.description)}
                        </div>
                      )}
                    </div>

                    {/* Right side - Compact date display */}
                    <div className="md:text-right flex-shrink-0">
                      <div
                        className="rounded-md px-4 py-2 text-white text-center"
                        style={{ backgroundColor: '#1a3a6e' }}
                      >
                        <div className="text-2xl font-bold">{event.startDate.getDate()}</div>
                        <div className="text-xs opacity-90">{event.startDate.getMonth() + 1}月</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
