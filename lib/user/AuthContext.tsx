import React from 'react';
import firebase from 'firebase/app';
import 'firebase/auth';

/**
 * Utility attributes and functions used to handle user auth state within an AuthContext.
 */
interface AuthContextState {
  /**
   * The current user. If no user is signed in, the user is anonymous.
   */
  user: User;

  /**
   * Returns whether a user is currently signed in to the Service.
   */
  isSignedIn: boolean;

  /**
   * Indicates if authentication is still loading
   */
  loading: boolean;

  /**
   * Signs in using Google OAuth pop-up.
   */
  signInWithGoogle: () => void;

  /**
   * Signs out of the current user session if active.
   */
  signOut: () => Promise<void>;

  /**
   * Check if a user already has a profile
   */
  hasProfile: boolean;

  profile: Registration;

  updateProfile: (newProfile: Registration) => void;

  /**
   * Updates user after logging in using password
   */
  updateUser: (user) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextState | undefined>(undefined); // Find a better solution for this

/**
 * A React hook that exposes user authentication information and functions.
 *
 * Any hooks that explicitly or implicitly rely on user identity must be within
 * an AuthProvider.
 */
function useAuthContext(): AuthContextState {
  const context = React.useContext(AuthContext);
  if (context == null) {
    throw new Error('useAuthState must be used in an AuthProvider');
  }
  return context;
}

/**
 * @return An AuthContext provider that handles authentication.
 */
function AuthProvider({ children }: React.PropsWithChildren<Record<string, any>>): JSX.Element {
  const [user, setUser] = React.useState<User>(null);
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState(null);

  const updateProfile = (profile: Registration) => {
    setProfile(profile);
  };

  const updateUser = async (firebaseUser: firebase.User | null) => {
    console.log('[AuthContext] 🔄 updateUser called, firebaseUser:', firebaseUser ? firebaseUser.uid : 'null');
    setLoading(true);
    if (firebaseUser === null) {
      // User is signed out
      // TODO(auth): Determine if we want to remove user data from device on sign out
      console.log('[AuthContext] ❌ User signed out, clearing profile');
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    const { displayName, email, photoURL, uid } = firebaseUser;
    console.log('[AuthContext] 👤 Firebase user:', { uid, email, displayName });

    const token = await firebaseUser.getIdToken();
    setUser({
      id: uid,
      token,
      firstName: displayName,
      lastName: '',
      preferredEmail: email,
      photoUrl: photoURL,
      permissions: ['hacker'],
      university: '',
    });
    
    console.log('[AuthContext] 📡 Fetching user profile from /api/userinfo...');
    // Use relative URL to work on any port
    const data = await fetch(`/api/userinfo?id=${encodeURIComponent(uid)}`, {
      mode: 'cors',
      headers: { Authorization: token },
      method: 'GET',
    });
    
    console.log('[AuthContext] 📥 API response status:', data.status);
    
    if (data.status === 404) {
      // 用户已登入但未注册，明确设置 profile 为 null
      console.log('[AuthContext] ⚠️  User is authenticated but not registered yet (404)');
      setProfile(null);
      setLoading(false);
      return;
    }
    if (data.status !== 200) {
      // API 调用失败，保留之前的状态，不要清空 profile
      console.error(
        '[AuthContext] ❌ API call failed, status:',
        data.status,
        '- keeping previous profile state',
      );
      setLoading(false);
      return;
    }
    const userData = await data.json();
    console.log('[AuthContext] ✅ User data fetched successfully');
    console.log('[AuthContext] 📊 userData keys:', Object.keys(userData));
    console.log('[AuthContext] 📊 userData.user:', userData.user ? 'exists' : 'missing');
    console.log('[AuthContext] 📊 userData.id:', userData.id);
    console.log('[AuthContext] 📊 userData.email:', userData.email);
    
    let permissions: UserPermission[] = userData.user?.permissions || ['hacker'];
    setUser((prev) => ({
      ...prev,
      firstName: userData.user?.firstName || prev?.firstName || '',
      lastName: userData.user?.lastName || prev?.lastName || '',
      preferredEmail: userData.user?.preferredEmail || prev?.preferredEmail || email,
      permissions,
      university: userData.university || prev?.university || '',
    }));
    
    console.log('[AuthContext] 💾 Setting profile with userData');
    setProfile(userData);
    console.log('[AuthContext] ✅ Profile set, hasProfile should be true');
    setLoading(false);
  };

  React.useEffect(() => {
    // Check if Firebase is initialized before setting up auth listener
    if (firebase.apps.length === 0) {
      console.warn('Firebase not initialized, skipping auth state listener');
      setLoading(false);
      return;
    }

    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (user !== null && !user.emailVerified) return;
      updateUser(user);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Signs out the currently signed-in user.
   *
   * This switches to the guest user.
   */
  async function signOut() {
    if (firebase.apps.length === 0) {
      console.warn('Firebase not initialized, cannot sign out');
      return Promise.resolve();
    }

    return firebase
      .auth()
      .signOut()
      .then(() => {
        setUser(null);
      })
      .catch((error) => {
        console.error('Could not sign out.', error);
      });
  }

  const signInWithGoogle = async () => {
    if (firebase.apps.length === 0) {
      console.warn('Firebase not initialized, cannot sign in');
      alert('驗證系統未配置，請聯繫管理員。');
      return Promise.resolve();
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    return firebase
      .auth()
      .signInWithPopup(provider)
      .then(async ({ credential, user }) => {
        if (user === null) {
          // Something really went wrong
          console.warn("The signed-in user is null? That doesn't seem right.");
          alert('登入過程中發生錯誤，請重試。');
          return;
        }
        await updateUser(user);
      })
      .catch((error) => {
        console.error('Error when signing in', error);
        const errorCode = error.code;
        let friendlyMessage = '';

        // Convert Firebase error codes to friendly Chinese messages
        switch (errorCode) {
          case 'auth/popup-closed-by-user':
            friendlyMessage = '登入視窗已關閉，請重試。';
            break;
          case 'auth/popup-blocked':
            friendlyMessage = '登入彈出視窗被瀏覽器阻擋，請允許彈出視窗並重試。';
            break;
          case 'auth/cancelled-popup-request':
            friendlyMessage = '登入請求已取消。';
            break;
          case 'auth/account-exists-with-different-credential':
            friendlyMessage = '此電子郵件已使用其他登入方式註冊。請使用原本的登入方式。';
            break;
          case 'auth/operation-not-allowed':
            friendlyMessage =
              'Google 登入功能未啟用。請在 Firebase Console 中啟用 Google 登入，或聯繫管理員。';
            break;
          case 'auth/unauthorized-domain':
            friendlyMessage = '此網域未授權使用 Google 登入。請聯繫管理員將網域添加到授權列表。';
            break;
          case 'auth/network-request-failed':
            friendlyMessage = '網路連線失敗，請檢查您的網路連線。';
            break;
          default:
            friendlyMessage = `Google 登入失敗：${error.message}`;
        }

        alert(friendlyMessage);
      });
  };

  const isSignedIn = user !== null;
  const hasProfile = profile !== null;

  const authContextValue: AuthContextState = {
    user,
    isSignedIn,
    loading,
    signInWithGoogle,
    signOut,
    hasProfile,
    profile,
    updateProfile,
    updateUser,
  };

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
}

export { AuthContext, AuthProvider, useAuthContext };
