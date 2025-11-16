import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function BootcampPage() {
  const router = useRouter();

  useEffect(() => {
    // CRITICAL FIX: If this page was accessed via client-side navigation (not direct URL),
    // force a full page reload to ensure AppHeader renders correctly
    // Check if we're in the browser and if this is a client-side navigation
    if (typeof window !== 'undefined' && window.performance) {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      // If navigation type is not 'navigate' (direct URL) or 'reload', force reload
      if (navEntry && navEntry.type !== 'navigate' && navEntry.type !== 'reload') {
        console.log('[Bootcamp] Forcing full page reload for proper AppHeader rendering');
        window.location.href = '/bootcamp';
        return;
      }
    }

    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Head>
        <title>RWA 黑客松特訓營 | RWA Hackathon Taiwan</title>
        <meta
          name="description"
          content="從小白到組隊參賽 - 專為區塊鏈新手及想系統性學習 DeFi/RWA 者設計的免費培訓營"
        />
      </Head>
      {/* Wrapper to ensure AppHeader is not covered */}
      <div style={{ marginTop: '56px', minHeight: 'calc(100vh - 56px)' }}>
        <iframe
          src="/bootcamp.html"
          className="w-full border-0"
          style={{
            minHeight: 'calc(100vh - 56px)',
            display: 'block',
            width: '100%',
            border: 'none',
          }}
          title="RWA 黑客松特訓營"
        />
      </div>
    </>
  );
}
