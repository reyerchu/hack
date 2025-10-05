import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { RequestHelper } from '../../lib/request-helper';
import { useAuthContext } from '../../lib/user/AuthContext';

/**
 * Sponsor專用頁面
 *
 * 贊助商專用儀表板
 * Route: /sponsor
 */
export default function SponsorPage(props: {
  announcements: Announcement[];
  scheduleEvents: ScheduleEvent[];
  challenges: Challenge[];
  sponsors: Sponsor[];
}) {
  const { user, isSignedIn, hasProfile } = useAuthContext();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);

  useEffect(() => {
    setAnnouncements(props.announcements);
    setChallenges(props.challenges.sort((a, b) => (a.rank > b.rank ? 1 : -1)));
    setSponsors(props.sponsors);
  }, [props.announcements, props.challenges, props.sponsors]);

  // 檢查用戶是否有sponsor權限
  const isSponsor =
    user.permissions?.includes('sponsor') ||
    user.permissions?.includes('admin') ||
    user.permissions?.includes('super_admin');

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-black text-center">請登入以查看贊助商儀表板</div>
      </div>
    );
  }

  if (!isSponsor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-black text-center">您沒有贊助商權限</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>贊助商儀表板 - 黑客松台灣</title>
        <meta name="description" content="贊助商專用儀表板" />
        <link rel="icon" href="/favicon.ico?v=2.0" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* 贊助商專用頭部 */}
        <div className="bg-green-600 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold">贊助商儀表板</h1>
            <p className="mt-2 text-green-100">
              歡迎，{user.firstName} {user.lastName}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 公告區域 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">最新公告</h2>
              <div className="space-y-3">
                {announcements.length > 0 ? (
                  announcements.slice(0, 5).map((announcement, index) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4">
                      <p className="text-gray-800">{announcement.announcement}</p>
                      {announcement.timestamp && (
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(announcement.timestamp).toLocaleString('zh-TW')}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">暫無公告</p>
                )}
              </div>
            </div>

            {/* 挑戰任務區域 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">挑戰任務</h2>
              <div className="space-y-3">
                {challenges.length > 0 ? (
                  challenges.slice(0, 5).map((challenge, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">{challenge.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{challenge.organization}</p>
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                        {challenge.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">暫無挑戰任務</p>
                )}
              </div>
            </div>

            {/* 贊助商資訊 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">贊助商資訊</h2>
              <div className="space-y-3">
                {sponsors.length > 0 ? (
                  sponsors.slice(0, 5).map((sponsor, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">{sponsor.reference}</h3>
                      {sponsor.link && (
                        <a
                          href={sponsor.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          查看詳情 →
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">暫無贊助商資訊</p>
                )}
              </div>
            </div>

            {/* 今日活動 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">今日活動</h2>
              <div className="space-y-3">
                {props.scheduleEvents.length > 0 ? (
                  props.scheduleEvents.slice(0, 5).map((event, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{event.title}</h3>
                        <p className="text-sm text-gray-600">{event.location}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(event.startDate).toLocaleString('zh-TW')} -
                          {new Date(event.endDate).toLocaleString('zh-TW')}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {event.type || '活動'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">今日暫無活動</p>
                )}
              </div>
            </div>
          </div>

          {/* 贊助商專用功能 */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">贊助商專用功能</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin" passHref>
                <a className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-medium text-gray-900">管理控制台</h3>
                  <p className="text-sm text-gray-600 mt-1">管理活動、用戶和系統設定</p>
                </a>
              </Link>
              <Link href="/admin/users" passHref>
                <a className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-medium text-gray-900">參與者管理</h3>
                  <p className="text-sm text-gray-600 mt-1">查看和管理活動參與者</p>
                </a>
              </Link>
              <Link href="/admin/stats" passHref>
                <a className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-medium text-gray-900">活動統計</h3>
                  <p className="text-sm text-gray-600 mt-1">查看活動統計和參與數據</p>
                </a>
              </Link>
            </div>
          </div>

          {/* 贊助商專用資訊 */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">贊助商專用資訊</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">活動參與統計</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">總參與人數：</span>
                    <span className="font-medium">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">已簽到人數：</span>
                    <span className="font-medium">-</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">挑戰提交數：</span>
                    <span className="font-medium">-</span>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">贊助商權益</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• 查看活動參與者資料</li>
                  <li>• 管理挑戰任務</li>
                  <li>• 查看活動統計數據</li>
                  <li>• 接收活動更新通知</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const protocol = context.req.headers.referer?.split('://')[0] || 'http';
  const host = context.req.headers.host || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  try {
    const { data: announcementData } = await RequestHelper.get<Announcement[]>(
      `${baseUrl}/api/announcements`,
      {},
    );
    const { data: scheduleData } = await RequestHelper.get<ScheduleEvent[]>(
      `${baseUrl}/api/schedule`,
      {},
    );
    const { data: challengeData } = await RequestHelper.get<Challenge[]>(
      `${baseUrl}/api/challenges/`,
      {},
    );
    const { data: sponsorData } = await RequestHelper.get<Sponsor[]>(`${baseUrl}/api/sponsor`, {});

    return {
      props: {
        announcements: announcementData || [],
        scheduleEvents: scheduleData || [],
        challenges: challengeData || [],
        sponsors: sponsorData || [],
      },
    };
  } catch (error) {
    console.error('Error fetching data for sponsor page:', error);
    return {
      props: {
        announcements: [],
        scheduleEvents: [],
        challenges: [],
        sponsors: [],
      },
    };
  }
};
