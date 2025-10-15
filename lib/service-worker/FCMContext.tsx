import { createContext, useContext, useEffect, useState } from 'react';
import firebase from 'firebase/app';
import 'firebase/messaging';
import { RequestHelper } from '../request-helper';
import { firebaseConfig } from '../firebase-client';
import 'firebase/messaging';

interface FCMContextState {
  fcmSw: ServiceWorkerRegistration;
  messageToken: string;
}

const FCMContext = createContext<FCMContextState | undefined>(undefined);

function useFCMContext(): FCMContextState {
  const context = useContext(FCMContext);
  if (!context) throw new Error('useSWContext must be used in a provider');
  return context;
}

function FCMProvider({ children }: React.PropsWithChildren<Record<string, any>>): JSX.Element {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration>();
  const [messageToken, setMessageToken] = useState<string>();

  useEffect(() => {
    // Only attempt to register service worker in browsers that support it
    if ('serviceWorker' in window.navigator) {
      window.navigator.serviceWorker
        .register(`/firebase-messaging-sw.js`)
        .then(listenForNotifications)
        .catch((error) => {
          console.log('Service worker registration failed:', error);
          // App continues to work without service worker/push notifications
        });
    } else {
      console.log('Service workers are not supported in this browser');
    }
  }, []);

  /**
   * Initializes the firebase messaging API
   * to listen for and recieve announcements
   */
  const listenForNotifications = async (registration: ServiceWorkerRegistration) => {
    // Set service worker registration object to state variable
    setSwRegistration(registration);
    console.log('Service Worker registered successfully');

    try {
      // Check if messaging is supported
      // Firebase Messaging requires HTTPS (except localhost) and modern browser support
      if (!firebase.messaging.isSupported()) {
        console.log('Firebase Messaging is not supported in this browser/environment');
        return;
      }

      // Initialize firebase app and get messaging
      if (firebase.apps.length <= 0) firebase.initializeApp(firebaseConfig);
      const messaging = firebase.messaging();

      // Ask user to enable notifications
      // If not granted, exit
      if (Notification.permission === 'default') await Notification.requestPermission();
      if (Notification.permission !== 'granted') {
        console.log('Notification permission not granted');
        return;
      }

      // Get token and save in database
      let token = await messaging.getToken({
        vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
      });

      if (!token) {
        console.log('No FCM token received');
        return;
      }

      await RequestHelper.post<{ token: string }, void>(
        '/api/tokens',
        { headers: { 'Content-Type': 'application/json' } },
        { token },
      );
      setMessageToken(token);

      // Listen for messages
      messaging.onMessage((payload) => {
        const { announcement, iconUrl } = payload.data;
        const options = {
          body: announcement,
          icon: iconUrl,
          tag: new Date().toUTCString(),
        };
        registration.showNotification('HackPortal Announcement', options);
      });

      console.log('Firebase Messaging initialized successfully');
    } catch (error: any) {
      // Gracefully handle messaging errors - app should continue to work
      console.log('Firebase Messaging not available:', error?.message || error);
      // Don't throw - allow the app to continue without push notifications
    }
  };

  const swContextValue: FCMContextState = {
    fcmSw: swRegistration,
    messageToken,
  };

  return <FCMContext.Provider value={swContextValue}>{children}</FCMContext.Provider>;
}

export { FCMContext, FCMProvider, useFCMContext };
