import { Transition, Dialog } from '@headlessui/react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import React, { Fragment } from 'react';
import AdminHeader from '../../../components/adminComponents/AdminHeader';
import ChallengeForm from '../../../components/adminComponents/challengeComponents/ChallengeForm';
import { RequestHelper } from '../../../lib/request-helper';
import { useAuthContext } from '../../../lib/user/AuthContext';
import Link from 'next/link';
import ChallengeList from '../../../components/adminComponents/challengeComponents/ChallengeList';
import { arrayMove } from '@dnd-kit/sortable';

interface ChallengePageProps {
  challenges_: Challenge[];
}

function isAuthorized(user): boolean {
  if (!user || !user.permissions) return false;
  return (user.permissions as string[]).includes('super_admin');
}

export default function ChallengePage({ challenges_ }: ChallengePageProps) {
  const { user, isSignedIn } = useAuthContext();
  const [challenges, setChallenges] = React.useState<SortableObject<Challenge>[]>(
    challenges_.sort((a, b) => a.rank - b.rank).map((obj, i) => ({ ...obj, id: i.toString() })),
  );
  const [currentChallengeEditIndex, setCurrentChallengeEditIndex] = React.useState<number>(-1);
  const [currentChallengeDeleteIndex, setCurrentChallengeDeleteIndex] = React.useState<number>(-1);
  const [modalOpen, setModalOpen] = React.useState(false);
  const nextChallengeIndex = challenges_.reduce((acc, curr) => Math.max(acc, curr.rank), 0) + 1;

  const submitEditChallengeRequest = async (challengeDataWrapper: SortableObject<Challenge>) => {
    const { id, ...challengeData } = challengeDataWrapper;
    try {
      const { status, data } = await RequestHelper.post<Challenge, unknown>(
        '/api/challenges',
        {
          headers: {
            Authorization: user.token,
          },
        },
        challengeData,
      );
      if (status >= 400) throw new Error(`${status} Error`);
      alert('Challenge info updated');
      setChallenges(
        challenges.map((challenge, idx) => {
          if (idx === currentChallengeEditIndex) return challengeDataWrapper;
          return challenge;
        }),
      );
    } catch (error) {
      alert('Unexpected error! Please try again');
      console.error(error);
    } finally {
      setCurrentChallengeEditIndex(-1);
    }
  };

  const submitReorderChallengesRequest = async () => {
    try {
      await RequestHelper.post<Challenge[], void>(
        '/api/challenges/reorder',
        {
          headers: {
            Authorization: user.token,
            'Content-Type': 'application/json',
          },
        },
        challenges.map(({ id, ...challenge }) => challenge),
      );
      alert('Reorder request completed');
      setChallenges((prev) => prev.map((obj, idx) => ({ ...obj, rank: idx })));
    } catch (error) {
      alert('Unexpected error! Please check console log for more info :(');
      console.log(error);
    }
  };

  const submitDeleteChallengeRequest = async () => {
    const { id, ...challengeData } = challenges[currentChallengeDeleteIndex];
    try {
      await RequestHelper.delete<Challenge, unknown>(
        '/api/challenges',
        {
          headers: {
            Authorization: user.token,
          },
        },
        challengeData,
      );
      alert('Challenge deleted successfully');
      setChallenges(challenges.filter((_, idx) => idx !== currentChallengeDeleteIndex));
      setModalOpen(false);
      setCurrentChallengeDeleteIndex(-1);
    } catch (error) {
      alert('Unexpected error. Please try again later');
      console.error(error);
    }
  };

  const orderChanged = challenges.filter((obj, idx) => obj.rank !== idx).length !== 0;

  if (!isSignedIn || !isAuthorized(user))
    return <div className="text-2xl font-black text-center pt-24">Unauthorized</div>;

  return (
    <div className="flex flex-col flex-grow min-h-screen bg-gray-50">
      <Head>
        <title>挑戰管理 - 管理員儀表板</title>
        <meta name="description" content="管理所有挑戰" />
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2 text-left" style={{ color: '#1a3a6e' }}>
            管理儀表板
          </h1>
        </div>
        <AdminHeader />

        {/* Management Cards Section */}
        <div className="mb-12">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: '#1a3a6e' }}
          >
            Challenge 管理功能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/admin/challenge-management">
              <a className="block bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2"
                 style={{ borderColor: '#e5e7eb' }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.borderColor = '#1a3a6e';
                   e.currentTarget.style.transform = 'translateY(-4px)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.borderColor = '#e5e7eb';
                   e.currentTarget.style.transform = 'translateY(0)';
                 }}>
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#1a3a6e' }}>
                  Challenge 分配管理
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  分配 challenges 給不同的 sponsors，管理賽道與贊助商的對應關係
                </p>
              </a>
            </Link>
            <Link href="/admin/add-sponsor">
              <a className="block bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2"
                 style={{ borderColor: '#e5e7eb' }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.borderColor = '#1a3a6e';
                   e.currentTarget.style.transform = 'translateY(-4px)';
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.borderColor = '#e5e7eb';
                   e.currentTarget.style.transform = 'translateY(0)';
                 }}>
                <div className="text-4xl mb-4">➕</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#1a3a6e' }}>
                  新增 Sponsor
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  添加新的贊助商資料，包含名稱、聯絡方式和權限設定
                </p>
              </a>
            </Link>
          </div>
        </div>

        {/* Challenges List Section */}
        <div className="mb-12">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: '#1a3a6e' }}
          >
            所有 Challenges
          </h2>

          <div>
            {currentChallengeEditIndex !== -1 ? (
              <div>
                <ChallengeForm
                  challenge={challenges[currentChallengeEditIndex]}
                  onSubmitClick={async (challenge) => {
                    await submitEditChallengeRequest({
                      id: currentChallengeEditIndex.toString(),
                      ...challenge,
                    });
                  }}
                  formAction="Edit"
                />
                <button
                  onClick={() => setCurrentChallengeEditIndex(-1)}
                  className="p-3 bg-gray-200 rounded-lg"
                >
                  Go Back
                </button>
              </div>
            ) : (
              <>
                <ChallengeList
                  onChallengeEditClick={(challengeIndex) => {
                    setCurrentChallengeEditIndex(challengeIndex);
                  }}
                  onChallengeDeleteClick={(challengeIndex) => {
                    setCurrentChallengeDeleteIndex(challengeIndex);
                    setModalOpen(true);
                  }}
                  challenges={challenges}
                  onUpdateOrder={(oldIndex, newIndex) => {
                    setChallenges((prev) => arrayMove(prev, oldIndex, newIndex));
                  }}
                />
                <div className="p-3 flex gap-x-4">
                  <Link href={`/admin/challenges/add?id=${nextChallengeIndex}`}>
                    <button className="p-3 bg-green-400 rounded-lg">Add New Challenge</button>
                  </Link>
                  <Link href="/admin">
                    <button className="p-3 bg-gray-200 rounded-lg">Go Back</button>
                  </Link>
                  {orderChanged && (
                    <button
                      onClick={async () => {
                        await submitReorderChallengesRequest();
                      }}
                      className="p-3 bg-green-400 rounded-lg"
                    >
                      Update Challenge Ranking
                    </button>
                  )}
                </div>
              </>
            )}
            {currentChallengeDeleteIndex !== -1 && (
              <Transition appear show={modalOpen} as={Fragment}>
                <Dialog
                  as="div"
                  className="relative z-10"
                  onClose={() => {
                    setModalOpen(false);
                  }}
                >
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                  </Transition.Child>

                  <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                      <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                      >
                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                          <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                            Delete Challenge
                          </Dialog.Title>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Are you sure you want to delete the{' '}
                              {challenges[currentChallengeDeleteIndex].title} challenge?
                            </p>
                          </div>

                          <div className="mt-4">
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                              onClick={async () => {
                                await submitDeleteChallengeRequest();
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </Dialog.Panel>
                      </Transition.Child>
                    </div>
                  </div>
                </Dialog>
              </Transition>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const protocol = context.req.headers.referer?.split('://')[0] || 'http';
  const { data } = await RequestHelper.get<Challenge[]>(
    `${protocol}://${context.req.headers.host}/api/challenges`,
    {},
  );
  return {
    props: {
      challenges_: data,
    },
  };
};
