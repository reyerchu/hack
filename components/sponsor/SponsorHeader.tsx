import { useRouter } from 'next/router';
import Link from 'next/link';

/**
 * Sponsor Dashboard Header with tabs
 */
export default function SponsorHeader() {
  const router = useRouter();

  const tabs = [
    { name: '賽道管理', href: '/sponsor/tracks', exactMatch: false },
    { name: '挑戰管理', href: '/sponsor/challenges', exactMatch: false },
    { name: '報表', href: '/sponsor/reports', exactMatch: false },
  ];

  const isActiveTab = (href: string, exactMatch: boolean) => {
    if (exactMatch) {
      return router.pathname === href;
    }
    return router.pathname.startsWith(href);
  };

  return (
    <div className="border-b-2 mb-8" style={{ borderColor: '#e5e7eb' }}>
      <nav className="-mb-0.5 flex space-x-8">
        {tabs.map((tab) => (
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

