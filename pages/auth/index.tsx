import React from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../lib/user/AuthContext';
import { useState } from 'react';
import firebase from 'firebase/app';
import Link from 'next/link';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import GoogleIcon from '../../public/icons/googleicon.png';
import Image from 'next/image';
/**
 * A page that allows the user to sign in.
 *
 * Route: /auth
 */
export default function AuthPage() {
  const { isSignedIn, signInWithGoogle, updateUser } = useAuthContext();
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [passwordResetDialog, setPasswordResetDialog] = useState(false);
  const [sendVerification, setSendVerification] = useState(false);
  const [signInOption, setSignInOption] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const signIn = () => {
    setSendVerification(false);
    setErrorMsg(''); // Clear previous errors
    firebase
      .auth()
      .signInWithEmailAndPassword(currentEmail, currentPassword)
      .then(async ({ user }) => {
        // Signed in
        if (!user.emailVerified) {
          setSendVerification(true);
          throw new Error('Email is not verified. Verify your email before logging in.');
        }
        await updateUser(user);
      })
      .catch((error) => {
        console.error('Login error:', error);
        const errorCode = error.code;
        const errorMessage = error.message;
        let friendlyMessage = '';

        // Check if error message contains specific patterns
        if (errorMessage && typeof errorMessage === 'string') {
          if (
            errorMessage.includes('INVALID_LOGIN_CREDENTIALS') ||
            errorMessage.includes('invalid-login-credentials') ||
            errorMessage.includes('invalid-credential')
          ) {
            friendlyMessage = '登入資訊錯誤。請檢查您的電子郵件和密碼，或先註冊帳號。';
            setErrorMsg(friendlyMessage);
            return;
          }
        }

        // Convert Firebase error codes to friendly Chinese messages
        switch (errorCode) {
          case 'auth/invalid-email':
            friendlyMessage = '電子郵件格式無效，請檢查您的輸入。';
            break;
          case 'auth/user-disabled':
            friendlyMessage = '此帳號已被停用，請聯繫管理員。';
            break;
          case 'auth/user-not-found':
            friendlyMessage = '找不到此帳號。請先註冊或使用 Google 登入。';
            break;
          case 'auth/wrong-password':
            friendlyMessage = '密碼錯誤，請重試或點擊「忘記密碼」重設。';
            break;
          case 'auth/invalid-login-credentials':
          case 'auth/invalid-credential':
            friendlyMessage = '登入資訊錯誤。請檢查您的電子郵件和密碼，或使用 Google 登入。';
            break;
          case 'auth/too-many-requests':
            friendlyMessage = '登入嘗試次數過多，請稍後再試。';
            break;
          case 'auth/network-request-failed':
            friendlyMessage = '網路連線失敗，請檢查您的網路連線。';
            break;
          default:
            // If no specific error code matched, provide a generic message
            friendlyMessage = '登入失敗。請檢查您的電子郵件和密碼是否正確。';
        }

        setErrorMsg(friendlyMessage);
      });
  };

  const signUp = () => {
    setErrorMsg(''); // Clear previous errors
    firebase
      .auth()
      .createUserWithEmailAndPassword(currentEmail, currentPassword)
      .then((userCredential) => {
        // Signed in
        var user = userCredential.user;
        //send email verification
        firebase
          .auth()
          .currentUser.sendEmailVerification()
          .then(() => {
            router.push('/auth');
            alert('帳號創建成功！請檢查您的電子郵件（包括垃圾郵件夾）以驗證您的帳號並登入。');
          });
      })
      .catch((error) => {
        var errorCode = error.code;
        let friendlyMessage = '';

        // Convert Firebase error codes to friendly Chinese messages
        switch (errorCode) {
          case 'auth/email-already-in-use':
            friendlyMessage = '此電子郵件已被註冊。請直接登入或使用「忘記密碼」功能。';
            break;
          case 'auth/invalid-email':
            friendlyMessage = '電子郵件格式無效，請檢查您的輸入。';
            break;
          case 'auth/operation-not-allowed':
            friendlyMessage = '註冊功能目前未啟用，請聯繫管理員。';
            break;
          case 'auth/weak-password':
            friendlyMessage = '密碼強度不足。請使用至少 6 個字元的密碼。';
            break;
          default:
            friendlyMessage = `註冊失敗：${error.message}`;
        }

        setErrorMsg(friendlyMessage);
      });
  };

  const sendResetEmail = () => {
    setErrorMsg(''); // Clear previous errors
    firebase
      .auth()
      .sendPasswordResetEmail(currentEmail)
      .then(() => {
        alert('密碼重設郵件已發送！請檢查您的電子郵件（包括垃圾郵件夾）。');
      })
      .catch((error) => {
        var errorCode = error.code;
        let friendlyMessage = '';

        // Convert Firebase error codes to friendly Chinese messages
        switch (errorCode) {
          case 'auth/invalid-email':
            friendlyMessage = '電子郵件格式無效，請檢查您的輸入。';
            break;
          case 'auth/user-not-found':
            friendlyMessage = '找不到此電子郵件對應的帳號。請確認您輸入的電子郵件是否正確。';
            break;
          case 'auth/too-many-requests':
            friendlyMessage = '請求過於頻繁，請稍後再試。';
            break;
          default:
            friendlyMessage = `發送重設郵件失敗：${error.message}`;
        }

        setErrorMsg(friendlyMessage);
      });
  };

  const sendVerificationEmail = () => {
    //send email verification
    try {
      firebase
        .auth()
        .currentUser.sendEmailVerification()
        .then(() => {
          router.push('/auth');
          alert('驗證郵件已發送，請檢查您的電子郵件以驗證帳號並登入。');
        });
    } catch (error) {
      alert('發送驗證郵件時發生問題。\n請稍候幾分鐘再重新嘗試。');
    }
  };

  function handleSubmit() {
    if (signInOption) {
      signIn();
    } else {
      signUp();
    }
  }

  if (isSignedIn) {
    router.push('/profile');
  }

  return (
    <>
      <section className="bg-secondary min-h-screen">
        <div className="p-4">
          <Link href="/" passHref>
            <div className="cursor-pointer items-center inline-flex text-primaryDark font-medium">
              <ChevronLeftIcon />
              返回活動網站
            </div>
          </Link>
        </div>
        <div className="py-2 md:px-16 px-10 flex items-center justify-center flex-wrap">
          <div className="xl:w-1/2 lg:w-2/3 w-5/6 my-4">
            <section
              id="signInSection"
              className="bg-white 2xl:min-h-[30rem] min-h-[28rem] rounded-lg p-6"
            >
              {!passwordResetDialog ? (
                <>
                  <h1 className="md:text-3xl text-2xl font-black text-center text-primaryDark mt-4">
                    {signInOption ? '登入' : '建立帳號'}
                  </h1>
                  <div className="text-center text-complementary/60 mt-4 mb-12">
                    {signInOption ? ' 第一次使用黑客松台灣？' : '已經有帳號了？'}{' '}
                    <span
                      onClick={() =>
                        signInOption ? setSignInOption(false) : setSignInOption(true)
                      }
                      className="text-primary cursor-pointer"
                    >
                      {signInOption ? '建立帳號' : '登入'}
                    </span>
                  </div>
                  <React.Fragment>
                    <form onSubmit={handleSubmit} className="mt-4">
                      <input
                        className="w-full rounded-md border border-complementary/20 p-2 mb-4"
                        value={currentEmail}
                        onChange={(e) => setCurrentEmail(e.target.value)}
                        type="text"
                        name="email"
                        autoComplete="email"
                        placeholder="電子郵件*"
                      ></input>
                      <input
                        className="w-full rounded-md border border-complementary/20 p-2 mb-2"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        autoComplete="current-password"
                        placeholder="密碼*"
                      ></input>
                      <div className="inline-flex md:flex justify-between md:flex-row flex-col-reverse">
                        <div
                          className="hover:underline cursor-pointer text-left text-primary"
                          onClick={() => {
                            setPasswordResetDialog(true);
                            setErrorMsg('');
                            setSendVerification(false);
                          }}
                        >
                          忘記密碼？
                        </div>
                        <div className="text-primaryDark text-base">
                          <input
                            className="mr-2 rounded-md text-primaryDark focus:ring-0 border border-primaryDark"
                            type="checkbox"
                            onClick={() => setShowPassword(!showPassword)}
                          />
                          {showPassword ? '隱藏密碼' : '顯示密碼'}
                        </div>
                        <input className="hidden" type="submit" value="Submit" />
                      </div>
                      <div className="flex justify-center mt-6 mb-4">
                        <button
                          type="button"
                          className="rounded-full text-base w-full text-white bg-primaryDark hover:brightness-90 px-4 py-2"
                          onClick={() => {
                            handleSubmit();
                          }}
                        >
                          {signInOption ? '登入' : '建立帳號'}
                        </button>
                      </div>
                    </form>
                    {/* Error and verification messages */}
                    <div className="text-center">{errorMsg}</div>
                    {/* !change if needed */}
                    {/* Uncomment to allow resend verification email option (users could spam) */}
                    {/* {sendVerification && (
                    <div className='flex justify-center'>
                      <button className="underline" onClick={() => sendVerificationEmail()}>
                        Resend verification
                      </button>
                    </div>
                  )} */}
                    <button
                      className="mt-6 px-4 py-2 w-full rounded-full border border-complementary/20 text-complementary bg-white my-4 text-base font-bold text-center flex items-center justify-center"
                      onClick={() => signInWithGoogle()}
                    >
                      <Image src={GoogleIcon} alt="GoogleIcon" width={25} height={25} />
                      <p className="mx-2">使用 Google 登入</p>
                    </button>
                  </React.Fragment>
                </>
              ) : (
                <React.Fragment>
                  <div className="text-left">
                    <ArrowBackIcon
                      className="cursor-pointer text-primaryDark"
                      onClick={() => {
                        setPasswordResetDialog(false);
                        setErrorMsg('');
                      }}
                    />
                  </div>
                  <h1 className="md:text-3xl text-2xl font-black text-center text-primaryDark mt-4">
                    重設密碼
                  </h1>
                  <div className="text-center text-complementary/60 mt-4 mb-12">
                    輸入您的電子郵件地址，我們將向您發送重設密碼的連結。
                  </div>

                  <input
                    className="w-full rounded-md border border-complementary/20 p-2 mb-4"
                    value={currentEmail}
                    onChange={(e) => setCurrentEmail(e.target.value)}
                    type="text"
                    name="email"
                    autoComplete="email"
                    placeholder="電子郵件*"
                  ></input>
                  <div className="flex justify-center mt-6 mb-4">
                    <button
                      type="button"
                      className="rounded-full text-base w-full text-white bg-primaryDark hover:brightness-90 px-4 py-2"
                      onClick={() => {
                        sendResetEmail();
                        setErrorMsg('');
                      }}
                    >
                      發送重設連結
                    </button>
                  </div>
                  {/* Error and verification messages */}
                  <div className="text-left">{errorMsg}</div>
                </React.Fragment>
              )}
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
