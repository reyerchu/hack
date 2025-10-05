import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { RequestHelper } from '../lib/request-helper';
import BackgroundCarousel from '../components/homeComponents/BackgroundCarousel';
import TSMCChallengeTimeline from '../components/homeComponents/TSMCChallengeTimeline';
import TSMCParticipationGuidelines from '../components/homeComponents/TSMCParticipationGuidelines';
import TSMCPrizePool from '../components/homeComponents/TSMCPrizePool';
import TSMCChallenges from '../components/homeComponents/TSMCChallenges';
import HomeSpeakers from '../components/homeComponents/HomeSpeakers';
import HomeTeam from '../components/homeComponents/HomeTeam';
import HomeSponsors from '../components/homeComponents/HomeSponsors';
import HomeFooter from '../components/homeComponents/HomeFooter';

/**
 * The home page.
 *
 * Landing: /
 *
 */
export default function Home(props: {
  keynoteSpeakers: KeynoteSpeaker[];
  challenges: Challenge[];
  answeredQuestion: AnsweredQuestion[];
  fetchedMembers: TeamMember[];
  sponsorCard: Sponsor[];
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for all components to render before showing page
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div>
        <h1>載入中...</h1>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>台灣首屆 RWA 黑客松</title>
        <meta
          name="description"
          content="台灣首屆 RWA 黑客松 - 論壇 + 研討會 + 黑客松，促成監理與金融機構、技術社群的跨域對話與 PoC 連結"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <BackgroundCarousel />
      <TSMCChallenges challenges={props.challenges} />
      <TSMCChallengeTimeline />
      <TSMCParticipationGuidelines />
      <TSMCPrizePool />
      <HomeSpeakers keynoteSpeakers={props.keynoteSpeakers} />
      <HomeTeam members={props.fetchedMembers} />
      <HomeSponsors sponsorCard={props.sponsorCard} />
      <HomeFooter />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Use localhost for server-side rendering to avoid circular requests
  const baseUrl = 'http://localhost:3000';
  const { data: keynoteData } = await RequestHelper.get<KeynoteSpeaker[]>(
    `${baseUrl}/api/keynotespeakers`,
    {},
  );
  const { data: challengeData } = await RequestHelper.get<Challenge[]>(
    `${baseUrl}/api/challenges/`,
    {},
  );
  const { data: answeredQuestion } = await RequestHelper.get<AnsweredQuestion[]>(
    `${baseUrl}/api/questions/faq`,
    {},
  );
  const { data: memberData } = await RequestHelper.get<TeamMember[]>(`${baseUrl}/api/members`, {});
  const { data: sponsorData } = await RequestHelper.get<Sponsor[]>(`${baseUrl}/api/sponsor`, {});
  return {
    props: {
      keynoteSpeakers: keynoteData,
      challenges: challengeData,
      answeredQuestion: answeredQuestion,
      fetchedMembers: memberData,
      sponsorCard: sponsorData,
    },
  };
};
