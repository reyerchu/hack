import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuthContext } from '../../lib/user/AuthContext';

function isAuthorized(user): boolean {
  if (!user || !user.permissions) return false;
  return (user.permissions as string[]).includes('super_admin');
}

/**
 * A dashboard header.
 */
export default function AdminHeader() {
  const { user } = useAuthContext();
  const router = useRouter();

  const tabs = [
    { name: '用戶管理', href: '/admin/users', exactMatch: false },
    { name: '團隊管理', href: '/admin/teams', exactMatch: false },
    { name: '贊助商管理', href: '/admin/sponsors', exactMatch: false },
    { name: '公告與問題', href: '/admin/announcements', exactMatch: false },
    { name: '統計', href: '/admin/stats', exactMatch: false, superAdminOnly: true },
    { name: '掃描', href: '/admin/scan', exactMatch: false },
  ];

  // Filter tabs based on permissions
  const filteredTabs = tabs.filter((tab) => {
    if (tab.superAdminOnly) {
      return isAuthorized(user);
    }
    return true;
  });

  const isActiveTab = (href: string, exactMatch: boolean) => {
    if (exactMatch) {
      return router.pathname === href;
    }
    return router.pathname.startsWith(href);
  };

  return null;
}
