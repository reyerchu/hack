import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { RequestHelper } from '../lib/request-helper';
import BackgroundCarousel from '../components/homeComponents/BackgroundCarousel';
import HomeNewsSection from '../components/homeComponents/HomeNewsSection';
import TSMCAbout from '../components/homeComponents/TSMCAbout';
import TSMCChallengeTimeline from '../components/homeComponents/TSMCChallengeTimeline';
import TSMCParticipationGuidelines from '../components/homeComponents/TSMCParticipationGuidelines';
import TSMCPrizePool from '../components/homeComponents/TSMCPrizePool';
import TSMCChallenges from '../components/homeComponents/TSMCChallenges';
import HomeSponsors from '../components/homeComponents/HomeSponsors';
import HomeFaqSection from '../components/homeComponents/HomeFaqSection';
import HomeLineGroup from '../components/homeComponents/HomeLineGroup';
import HomeOrganizers from '../components/homeComponents/HomeOrganizers';
import HomeFooter from '../components/homeComponents/HomeFooter';

/**
 * The home page.
 *
 * Landing: /
 *
 */
export default function Home(props: { challenges: Challenge[]; sponsorCard: Sponsor[] }) {
  return (
    <>
      <Head>
        <title>台灣首屆 RWA 黑客松</title>
        <meta
          name="description"
          content="台灣首屆 RWA 黑客松 - 論壇 + 研討會 + 黑客松，促成監理與金融機構、技術社群的跨域對話與 PoC 連結"
        />
        <link rel="icon" href="/favicon.ico?v=2.0" />
      </Head>

      <BackgroundCarousel />
      <TSMCAbout />
      <HomeNewsSection />
      <TSMCChallengeTimeline />
      <TSMCParticipationGuidelines />
      <TSMCPrizePool />
      <TSMCChallenges challenges={props.challenges} />
      <HomeSponsors sponsorCard={props.sponsorCard} />
      <HomeFaqSection />
      <HomeOrganizers />
      <HomeLineGroup />
      <HomeFooter />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Use localhost for server-side rendering to avoid circular requests
  const baseUrl = 'http://localhost:3008';
  const { data: challengeData } = await RequestHelper.get<Challenge[]>(
    `${baseUrl}/api/challenges/`,
    {},
  );
  const { data: sponsorData } = await RequestHelper.get<Sponsor[]>(`${baseUrl}/api/sponsor`, {});
  return {
    props: {
      challenges: challengeData,
      sponsorCard: sponsorData,
    },
  };
};
