import { useRouter } from 'next/router';
import Head from 'next/head';
import ChallengeForm from '../../../components/adminComponents/challengeComponents/ChallengeForm';
import { RequestHelper } from '../../../lib/request-helper';
import { useAuthContext } from '../../../lib/user/AuthContext';
import AdminHeader from '../../../components/adminComponents/AdminHeader';
import Link from 'next/link';

function isAuthorized(user): boolean {
  if (!user || !user.permissions) return false;
  return (user.permissions as string[]).includes('super_admin');
}

export default function AddChallengePage() {
  const { user, isSignedIn } = useAuthContext();
  const router = useRouter();

  const submitAddChallengeRequest = async (challengeData: Challenge) => {
    try {
      await RequestHelper.post<Challenge, Challenge>(
        '/api/challenges',
        {
          headers: {
            Authorization: user.token,
          },
        },
        {
          ...challengeData,
          rank: parseInt(router.query.id as string),
        },
      );
      alert('Challenge created');
      router.push('/admin/challenges');
    } catch (error) {
      alert('Unexpected error! Please try again');
      console.error(error);
    }
  };

  if (!isSignedIn || !isAuthorized(user))
    return <div className="text-2xl font-black text-center pt-24">Unauthorized</div>;

  return (
    <div className="flex flex-col flex-grow">
      <Head>
        <title>新增挑戰 - 管理員儀表板</title>
        <meta name="description" content="新增挑戰" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="mb-12 text-left">
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#1a3a6e' }}>
              管理儀表板
            </h1>
          </div>

          <AdminHeader />

          <div className="mb-8">
            <h2 className="text-2xl font-bold" style={{ color: '#1a3a6e' }}>
              新增挑戰
            </h2>
          </div>

          <div
            className="bg-white rounded-lg shadow-sm border-2 p-6 mb-6"
            style={{ borderColor: '#e5e7eb' }}
          >
            <ChallengeForm
              onSubmitClick={async (challenge) => {
                await submitAddChallengeRequest(challenge);
              }}
              formAction="Add"
            />
          </div>

          <Link href="/admin/challenges">
            <button
              className="px-6 py-3 rounded-lg font-semibold transition-colors"
              style={{
                backgroundColor: '#e5e7eb',
                color: '#374151',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }}
            >
              返回列表
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
