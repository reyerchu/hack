/**
 * 找隊友 - 列表頁
 */

import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AppHeader from '../../components/AppHeader';
import { TeamNeed, GetNeedsQueryParams } from '../../lib/teamUp/types';
import { PAGINATION_DEFAULTS } from '../../lib/teamUp/constants';
import TeamUpList from '../../components/teamUp/TeamUpList';
import SearchBar from '../../components/teamUp/SearchBar';
import FilterPanel from '../../components/teamUp/FilterPanel';

interface TeamUpIndexProps {
  initialNeeds: TeamNeed[];
  initialTotal: number;
  initialFilters: GetNeedsQueryParams;
}

export default function TeamUpIndex({
  initialNeeds,
  initialTotal,
  initialFilters,
}: TeamUpIndexProps) {
  const router = useRouter();
  const [needs, setNeeds] = useState<TeamNeed[]>(initialNeeds);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<GetNeedsQueryParams>(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search || '');

  // 當 URL query 變化時，重新加載數據
  useEffect(() => {
    if (router.isReady) {
      fetchNeeds();
    }
  }, [router.query]);

  const fetchNeeds = async () => {
    setLoading(true);
    try {
      // 只發送角色參數到 API（最重要的過濾條件）
      // 其他過濾（賽道、階段、排序）在客戶端進行
      const params = new URLSearchParams();

      if (filters.roles && filters.roles.length > 0)
        params.append('roles', filters.roles.join(','));
      if (filters.search) params.append('search', filters.search);
      // 固定只顯示開放中的需求
      params.append('isOpen', 'true');
      // 從 API 獲取所有符合角色的結果，不分頁
      params.append('sort', 'latest');
      params.append('limit', '100'); // 獲取足夠多的結果
      params.append('offset', '0');

      const response = await fetch(`/api/team-up/needs?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        // 在客戶端進行二次過濾
        let filteredNeeds = data.data;

        // 按賽道過濾
        if (filters.track) {
          filteredNeeds = filteredNeeds.filter(
            (need: TeamNeed) => need.projectTrack === filters.track,
          );
        }

        // 按階段過濾
        if (filters.stage) {
          filteredNeeds = filteredNeeds.filter(
            (need: TeamNeed) => need.projectStage === filters.stage,
          );
        }

        // 按專案狀態過濾
        if ((filters as any).projectStatuses && (filters as any).projectStatuses.length > 0) {
          filteredNeeds = filteredNeeds.filter((need: TeamNeed) => {
            const statuses = (filters as any).projectStatuses;
            // 如果選擇了「已有專案」，顯示 title !== '尋找題目中'
            const matchesHasProject =
              statuses.includes('hasProject') && need.title !== '尋找題目中';
            // 如果選擇了「尋找題目中」，顯示 title === '尋找題目中'
            const matchesSeekingTopic =
              statuses.includes('seekingTopic') && need.title === '尋找題目中';
            return matchesHasProject || matchesSeekingTopic;
          });
        }

        // 客戶端排序
        const sortField = filters.sort || 'latest';
        if (sortField === 'popular') {
          filteredNeeds.sort((a: TeamNeed, b: TeamNeed) => (b.viewCount || 0) - (a.viewCount || 0));
        } else if (sortField === 'applications') {
          filteredNeeds.sort(
            (a: TeamNeed, b: TeamNeed) => (b.applicationCount || 0) - (a.applicationCount || 0),
          );
        } else {
          // latest: 按更新時間排序
          filteredNeeds.sort((a: TeamNeed, b: TeamNeed) => {
            const timeA = a.updatedAt?.seconds || 0;
            const timeB = b.updatedAt?.seconds || 0;
            return timeB - timeA;
          });
        }

        setNeeds(filteredNeeds);
        setTotal(filteredNeeds.length);
      }
    } catch (error) {
      console.error('Error fetching needs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: GetNeedsQueryParams) => {
    setFilters(newFilters);
    // 更新 URL
    router.push(
      {
        pathname: '/team-up',
        query: Object.fromEntries(
          Object.entries(newFilters).filter(([_, v]) => v !== undefined && v !== ''),
        ),
      },
      undefined,
      { shallow: true },
    );
  };

  const handleResetFilters = () => {
    const defaultFilters: GetNeedsQueryParams = {
      sort: 'latest',
      limit: PAGINATION_DEFAULTS.LIMIT,
      offset: 0,
    };
    // 添加默認的專案狀態
    (defaultFilters as any).projectStatuses = ['hasProject', 'seekingTopic'];
    setFilters(defaultFilters);
    setSearchInput('');
    router.push('/team-up', undefined, { shallow: true });
  };

  const handleSearch = () => {
    handleFilterChange({
      ...filters,
      search: searchInput || undefined,
      offset: 0,
    });
  };

  const handleLoadMore = () => {
    handleFilterChange({
      ...filters,
      offset: (filters.offset || 0) + (filters.limit || PAGINATION_DEFAULTS.LIMIT),
    });
  };

  const hasMore = (filters.offset || 0) + needs.length < total;

  return (
    <>
      <Head>
        <title>找隊友 | RWA Hackathon Taiwan</title>
        <meta name="description" content="RWA 黑客松找隊友平台，尋找志同道合的夥伴一起參賽" />
      </Head>

      <AppHeader />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-20">
          {/* 頁面標題 */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
                  找隊友
                </h1>
                <p className="text-gray-600 text-base">瀏覽 {total} 個找隊友需求，找到最適合的團隊</p>
              </div>
              <Link href="/team-up/create">
                <a
                  className="inline-block border-2 px-6 py-2 text-[14px] font-medium uppercase tracking-wider transition-colors duration-300"
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
                  + 發布需求
                </a>
              </Link>
            </div>

            {/* 搜索欄 */}
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSearch={handleSearch}
              placeholder="搜尋專案名稱或描述..."
            />
          </div>

          {/* 篩選面板 */}
          <FilterPanel
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
          />

          {/* 需求列表 */}
          <TeamUpList
            needs={needs}
            loading={loading}
            emptyMessage={
              filters.search ? `找不到包含「${filters.search}」的需求` : '目前沒有找隊友需求'
            }
          />

          {/* 加載更多按鈕 */}
          {hasMore && !loading && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                className="px-8 py-2 border-2 text-[14px] font-medium uppercase tracking-wider transition-colors duration-300"
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
                載入更多
              </button>
            </div>
          )}

          {/* Loading indicator */}
          {loading && (filters.offset || 0) > 0 && (
            <div className="mt-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { query } = context;

  // 構建初始篩選條件（移除所有 undefined 值）
  const initialFilters: any = {
    sort: (query.sort as any) || 'latest',
    limit: Number(query.limit) || PAGINATION_DEFAULTS.LIMIT,
    offset: Number(query.offset) || 0,
    isOpen: true, // 默認只顯示開放中的需求
    projectStatuses: ['hasProject', 'seekingTopic'], // 默認顯示所有專案狀態
  };

  // 只添加有值的篩選條件
  if (query.roles) initialFilters.roles = (query.roles as string).split(',');
  if (query.search) initialFilters.search = query.search as string;
  // 如果 URL 有指定專案狀態，覆蓋默認值
  if (query.projectStatuses)
    initialFilters.projectStatuses = (query.projectStatuses as string).split(',');

  try {
    // 構建 API URL
    const params = new URLSearchParams();
    if (initialFilters.roles) params.append('roles', initialFilters.roles.join(','));
    if (initialFilters.search) params.append('search', initialFilters.search);
    if (initialFilters.isOpen !== undefined)
      params.append('isOpen', initialFilters.isOpen.toString());
    params.append('sort', initialFilters.sort || 'latest');
    params.append('limit', initialFilters.limit!.toString());
    params.append('offset', initialFilters.offset!.toString());

    // 在服務器端調用 API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:3008`;
    const response = await fetch(`${baseUrl}/api/team-up/needs?${params.toString()}`);
    const data = await response.json();

    if (data.success) {
      return {
        props: {
          initialNeeds: data.data,
          initialTotal: data.pagination.total,
          initialFilters,
        },
      };
    }
  } catch (error) {
    console.error('Error fetching needs in SSR:', error);
    // SSR 失敗時返回空數據，由客戶端重新加載
  }

  // 失敗時返回空數據，頁面將在客戶端再次嘗試加載
  return {
    props: {
      initialNeeds: [],
      initialTotal: 0,
      initialFilters,
    },
  };
};
