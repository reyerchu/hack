import { useRouter } from 'next/router';
import Image from 'next/image';
import React from 'react';
import { useAuthContext } from '../lib/user/AuthContext';
import QRCode from '../components/dashboardComponents/QRCode';

/**
 * A page that allows a user to modify app or profile settings and see their data.
 *
 * Route: /profile
 */
export default function ProfilePage() {
  const router = useRouter();
  const { isSignedIn, hasProfile, user, profile } = useAuthContext();

  if (!isSignedIn) {
    return <div className="p-4 flex-grow text-center">請登入以查看您的個人檔案！</div>;
  }

  if (!hasProfile) {
    router.push('/register');
    return <div></div>;
  }

  return (
    <div className="p-8 w-full">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold">使用者個人檔案</h1>
        <section className="w-full py-5">
          <div className="flex flex-col md:flex-row gap-x-10">
            <div
              className="bg-gray-300 w-full md:w-2/3 rounded-xl p-4 flex flex-col justify-around"
              style={{ minHeight: '500px' }}
            >
              <h1 className="font-bold text-xl text-center">黑客松台灣</h1> {/* !change */}
              <div className="mx-auto">
                <QRCode data={'hack:' + user.id} loading={false} width={200} height={200} />
              </div>
              <div>
                <h1 className="text-center font-bold text-xl">{`${profile.user.firstName} ${profile.user.lastName}`}</h1>
                <p className="text-center">
                  {profile.user.permissions[0] === 'hacker' ? '黑客' : profile.user.permissions[0]}
                </p>
              </div>
            </div>
              <div className="w-full my-5">
              <div className="profile-view">
                <div className="profile-view-name flex flex-col gap-y-2">
                  <div className="font-bold text-xl">姓名</div>
                  <h1 className="font-bold">{`${profile.user.firstName} ${profile.user.lastName}`}</h1>
                </div>
                <div className="profile-view-role flex flex-col gap-y-2">
                  <div className="font-bold text-xl">角色</div>
                  <h1 className="font-bold">
                    {profile.user.permissions[0] === 'hacker' ? '黑客' : profile.user.permissions[0]}
                  </h1>
                </div>
                {profile.github && (
                  <div className="profile-view-github flex flex-col gap-y-2">
                    <div className="font-bold text-xl">Github</div>
                    <a
                      href={profile.github.startsWith('http') ? profile.github : `https://github.com/${profile.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {profile.github}
                    </a>
                  </div>
                )}
                {profile.linkedin && (
                  <div className="profile-view-linkedin flex flex-col gap-y-2">
                    <div className="font-bold text-xl">LinkedIn</div>
                    <a
                      href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {profile.linkedin}
                    </a>
                  </div>
                )}
                {profile.website && (
                  <div className="profile-view-website flex flex-col gap-y-2">
                    <div className="font-bold text-xl">個人網站</div>
                    <a
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
