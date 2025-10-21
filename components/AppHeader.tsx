import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import MenuIcon from '@material-ui/icons/Menu';
import CloseIcon from '@material-ui/icons/Close';
import ProfileDialog from './ProfileDialog';
import { useUser } from '../lib/profile/user-data';
import { useAuthContext } from '../lib/user/AuthContext';
import { navItems } from '../lib/data';
import firebase from 'firebase/app';
import Image from 'next/image';

/**
 * A global site header throughout the entire app.
 */
export default function AppHeader() {
  const [showMenu, setShowMenu] = useState(false);
  const { isSignedIn, hasProfile, profile } = useAuthContext();
  const [mobileIcon, setMobileIcon] = useState(true);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [dynamicNavItems, setDynamicNavItems] = useState(navItems);
  const user = useUser();

  useEffect(() => {
    // Check if Firebase is initialized before accessing auth
    if (firebase.apps.length > 0) {
      if (firebase.auth().currentUser !== null && !firebase.auth().currentUser.emailVerified) {
        firebase
          .auth()
          .signOut()
          .then(() => {
            //signed out succesfully
          })
          .catch((error) => {
            console.warn('Could not sign out');
          });
      }
    }

    //creating dynamic nav items
    setDynamicNavItems(() => {
      let updatedNavItems = [...navItems]; // Always start from base navItems

      if (isSignedIn && profile && profile.user) {
        // Get user permissions
        const permissions = profile.user.permissions || [];
        console.log('[AppHeader] User permissions:', permissions);
        console.log('[AppHeader] Profile structure:', profile.user);

        // Add team registration link for all signed-in users
        if (updatedNavItems.filter(({ text }) => text === '團隊報名').length === 0) {
          updatedNavItems = [...updatedNavItems, { text: '團隊報名', path: '/team-register' }];
          console.log('[AppHeader] Added 團隊報名 link');
        }

        // Check if user is admin or super_admin
        const isAdmin = 
          permissions.includes('admin') || 
          permissions.includes('super_admin') ||
          permissions[0] === 'admin' ||
          permissions[0] === 'super_admin';

        // Add admin link for admin/super_admin
        if (isAdmin && updatedNavItems.filter(({ text }) => text === '管理員').length === 0) {
          updatedNavItems = [...updatedNavItems, { text: '管理員', path: '/admin' }];
          console.log('[AppHeader] Added 管理員 link');
        }

        // Check if user is sponsor, admin, or super_admin
        const isSponsor = 
          permissions.includes('sponsor') ||
          permissions.includes('admin') ||
          permissions.includes('super_admin');

        // Add sponsor link for sponsor users
        if (isSponsor && updatedNavItems.filter(({ text }) => text === '賛助商').length === 0) {
          updatedNavItems = [...updatedNavItems, { text: '賛助商', path: '/sponsor/dashboard' }];
          console.log('[AppHeader] Added 賛助商 link');
        }
      }

      return updatedNavItems;
    });

    // Handle click outside profile dialog
    const handleClickOutside = (event: MouseEvent) => {
      const targetComponent = document.querySelector('.profileDialog');
      if (targetComponent !== null && !targetComponent.contains(event.target as Node)) {
        dismissDialog();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSignedIn, profile]); // Add dependencies to re-run when user logs in

  const toggleMenu = () => {
    setShowMenu(!showMenu);
    setMobileIcon(!mobileIcon);
  };

  const dismissDialog = () => {
    setShowProfileDialog(false);
  };
  const toggleDialog = () => {
    setShowProfileDialog(!showProfileDialog);
  };

  return (
    <>
      <header className="top-0 fixed justify-between flex flex-row w-full bg-white items-center h-14 z-30 px-6 py-2 drop-shadow">
        <div className="flex flex-row order-1 md:order-none items-center">
          {/* Smartphone nav */}
          <div onClick={toggleMenu} className="md:hidden cursor-pointer text-complementary">
            {mobileIcon ? <MenuIcon /> : <CloseIcon />}
            <ul
              className={`${
                showMenu ? 'translate-x-0' : '-translate-x-full'
              } transform transition-all ease-out duration-300 flex w-52 h-screen flex-col bg-white fixed top-0 left-0 z-[-1] mt-[56px] border-t-2 border-complementary/10`}
            >
              {dynamicNavItems
                .filter(({ text }) => text !== 'Home')
                .map((item) => (
                  <Link key={item.text} href={item.path}>
                    <a className={`px-5 py-3 hover:bg-primaryDark hover:text-white border-b border-gray-100 ${
                      item.text === '團隊報名' ? 'text-red-800' : 'text-complementary'
                    }`}>
                      <p className="text-sm font-medium">{item.text}</p>
                    </a>
                  </Link>
                ))}
            </ul>
          </div>
          <Link href="/">
            <a className="flex gap-2 ml-[6px] font-display self-center items-center md:ml-0">
              <Image src={'/rwa-logo.svg'} width="100px" height="32px" alt="RWA Hackathon Taiwan" />
            </a>
          </Link>
        </div>

        {/* PC nav */}
        <div className="hidden text-xs order-2 md:flex flex-center md:text-center lg:ml-12 text-complementary space-x-6 lg:space-x-12">
          {dynamicNavItems.map((item) => (
            <Link key={item.text} href={item.path}>
              <a>
                <p className={`md:mx-4 text-sm font-bold ${
                  item.text === '團隊報名' ? 'text-red-800' : ''
                }`}>{item.text}</p>
              </a>
            </Link>
          ))}
        </div>
        <div className="flex flex-row justify-center items-center order-2 md:order-3">
          {!user || !isSignedIn ? (
            <Link href="/auth">
              <a
                className="font-header font-bold rounded-full text-white text-sm px-10 py-1 transition duration-300 ease-in-out"
                style={{ backgroundColor: '#1a3a6e' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a4a7e')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1a3a6e')}
              >
                報名｜登入
              </a>
            </Link>
          ) : (
            <button
              className="font-header font-bold rounded-full text-white text-sm px-10 py-1 transition duration-300 ease-in-out"
              style={{ backgroundColor: '#1a3a6e' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a4a7e')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1a3a6e')}
              onClick={toggleDialog}
            >
              {hasProfile ? '個人中心' : '註冊'}
            </button>
          )}
        </div>
      </header>
      {showProfileDialog && <ProfileDialog onDismiss={dismissDialog} />}
    </>
  );
}
