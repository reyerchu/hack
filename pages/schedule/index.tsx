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
        return 'bg-red-100 text-red-700 border-red-300';
      case 2:
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 3:
        return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      case 4:
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 5:
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-black mb-3 text-gray-900">時程表</h1>
        <p className="text-gray-600 mb-8">*所有活動時間均以台灣時間（GMT+8）為準</p>

        {sortedEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-xl text-gray-500">目前沒有安排的活動</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedEvents.map((event, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Left side - Main info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getEventTypeColor(
                            event.Event,
                          )}`}
                        >
                          {getEventTypeLabel(event.Event)}
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold text-gray-900 mb-3">{event.title}</h2>

                      {event.description && (
                        <p className="text-gray-600 mb-4 whitespace-pre-line">{event.description}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <CalendarIcon className="text-gray-400" style={{ fontSize: '18px' }} />
                          <span className="font-medium">{formatDate(event.startDate)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                          <ClockIcon className="text-gray-400" style={{ fontSize: '18px' }} />
                          <span className="font-medium">
                            {formatTime(event.startDate, event.endDate)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700">
                          <PinDrop className="text-gray-400" style={{ fontSize: '18px' }} />
                          <span className="font-medium">{event.location || '待定'}</span>
                        </div>

                        {event.speakers && event.speakers.length > 0 && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <PersonIcon className="text-gray-400" style={{ fontSize: '18px' }} />
                            <span className="font-medium">{event.speakers.join('、')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right side - Date display */}
                    <div className="md:text-right flex-shrink-0">
                      <div className="bg-gradient-to-br from-primaryDark to-primary text-white rounded-lg p-4 min-w-[100px] text-center">
                        <div className="text-3xl font-bold">
                          {event.startDate.getDate()}
                        </div>
                        <div className="text-sm opacity-90">
                          {event.startDate.getMonth() + 1}月
                        </div>
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
