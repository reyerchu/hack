import { GetStaticProps } from 'next';
import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import { useEffect } from 'react';

interface BootcampPageProps {
  htmlContent: string;
}

export default function BootcampPage({ htmlContent }: BootcampPageProps) {
  useEffect(() => {
    // Force scroll to top when component mounts (for client-side navigation)
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
      <div
        className="bootcamp-page-wrapper"
        style={{ minHeight: '100vh' }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const filePath = path.join(process.cwd(), 'public', 'bootcamp.html');
    const htmlContent = fs.readFileSync(filePath, 'utf8');

    return {
      props: {
        htmlContent,
      },
    };
  } catch (error) {
    console.error('Error reading bootcamp.html:', error);
    return {
      props: {
        htmlContent: '<h1>Bootcamp content temporarily unavailable</h1>',
      },
    };
  }
};
