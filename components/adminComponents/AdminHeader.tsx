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
    { name: '使用者', href: '/admin/users', exactMatch: false },
    { name: '活動', href: '/admin/events', exactMatch: false },
    { name: '挑戰', href: '/admin/challenges', exactMatch: false },
    { name: '公告與問題', href: '/admin/announcements', exactMatch: false },
    { name: '統計', href: '/admin/stats', exactMatch: false, superAdminOnly: true },
    { name: '掃描', href: '/admin/scan', exactMatch: false },
  ];

  // Filter tabs based on permissions
  const filteredTabs = tabs.filter(tab => {
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

  return (
    <div className="border-b-2 mb-8" style={{ borderColor: '#e5e7eb' }}>
      <nav className="-mb-0.5 flex space-x-8">
        {filteredTabs.map((tab) => (
          <Link key={tab.href} href={tab.href}>
            <a
              className="py-4 px-1 border-b-2 font-medium text-[14px] transition-colors"
              style={
                isActiveTab(tab.href, tab.exactMatch)
                  ? { borderColor: '#1a3a6e', color: '#1a3a6e' }
                  : { borderColor: 'transparent', color: '#6b7280' }
              }
              onMouseEnter={(e) => {
                if (!isActiveTab(tab.href, tab.exactMatch)) {
                  e.currentTarget.style.color = '#374151';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActiveTab(tab.href, tab.exactMatch)) {
                  e.currentTarget.style.color = '#6b7280';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              {tab.name}
            </a>
          </Link>
        ))}
      </nav>
    </div>
  );
}
