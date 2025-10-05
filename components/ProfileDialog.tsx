import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import NotesIcon from '@material-ui/icons/Notes';
import { useAuthContext } from '../lib/user/AuthContext';

/**
 * Component properties for a ProfileDialog.
 */
interface ProfileDialogProps {
  /**
   * A callback triggered when the dialog should be dismissed.
   */
  onDismiss: () => void;
}

const ROLE_MAPPINGS: Record<UserPermission, string> = {
  hacker: '黑客',
  admin: '活動管理員',
  sponsor: '活動贊助商',
  organizer: '活動組織者',
  super_admin: '超級管理員',
  judge: '評審',
};

/**
 * A dialog that has quick links to actions in the app.
 *
 * It supports:
 * - Link to profile
 * - Sign in/Sign out
 */
export default function ProfileDialog({ onDismiss }: ProfileDialogProps) {
  const { user, isSignedIn, hasProfile } = useAuthContext();
  let name: string;
  let role: string;
  if (user != null) {
    const { firstName, lastName, permissions } = user;

    name = firstName !== null ? `${firstName} ${lastName}` : '';
    // TODO: Come up with more robust way of implementing this
    role = permissions && permissions.length > 0 ? ROLE_MAPPINGS[permissions[0]] : '黑客';
  } else {
    name = '訪客';
    role = '使用者';
  }

  return (
    <div className="profileDialog absolute top-8 right-8 min-w-xl max-w-2xl shadow-lg rounded-md bg-gray-800 text-white">
      {/* TODO: Don't show specific UI unless signed in */}
      <div className="flex px-4 pt-4 pb-2">
        {/* TODO: Handle default undefined photo URL with default */}
        {user && user.photoUrl && (
          <Image
            className="rounded-full object-cover"
            src={user.photoUrl}
            height={64}
            width={64}
            alt="Your profile"
          />
        )}
        {(isSignedIn && (
          <div className="ml-4 py-2 mr-4">
            <div className="text-lg font-bold text-white">{name}</div>
            <div className="text-md text-gray-300">{role}</div>
          </div>
        )) || (
          <div className="p-4 text-lg font-bold text-white">登入以將活動加入您的時程表、簽到等更多功能！</div>
        )}
      </div>
      {(isSignedIn && (
        <>
          <div onClick={onDismiss}>
            <Link href="/profile">
              <a className="block p-4 hover:bg-gray-700 text-white">
                <NotesIcon />
                <span className="ml-4">{hasProfile ? '您的個人檔案' : '註冊'}</span>
              </a>
            </Link>
          </div>
          <div className="rounded-b-md" onClick={onDismiss}>
            <Link href="/auth/signOut">
              <a className="block p-4 hover:bg-gray-700 rounded-b-md text-white">
                <ExitToAppIcon />
                <span className="ml-4">登出</span>
              </a>
            </Link>
          </div>
        </>
      )) || (
        <div className="rounded-b-md" onClick={onDismiss}>
          <Link href="/auth">
            <a className="block p-4 hover:bg-gray-700 rounded-b-md text-white">
              {/* TODO: Swap with better icon */}
              <ExitToAppIcon />
              <span className="ml-4">登入</span>
            </a>
          </Link>
        </div>
      )}
    </div>
  );
}
