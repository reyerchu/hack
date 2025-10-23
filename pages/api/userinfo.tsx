import { NextApiRequest, NextApiResponse } from 'next';
import { auth, firestore } from 'firebase-admin';
import initializeApi from '../../lib/admin/init';

initializeApi();

const db = firestore();

const REGISTRATION_COLLECTION = '/registrations';

async function userIsAuthorized(token: string, queryId: string) {
  if (!token) return false;
  try {
    const payload = await auth().verifyIdToken(token);
    if (payload.uid === queryId) return true;
    const snapshot = await firestore()
      .collection(REGISTRATION_COLLECTION)
      .where('id', '==', payload.uid)
      .get();
    if (snapshot.empty) return false;
    for (let userRole of snapshot.docs[0].data().user.permissions as string[]) {
      if (userRole === 'super_admin' || userRole === 'admin') return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
}

/**
 * Handles GET requests to /api/scantypes.
 *
 * This returns all scantypes the user is authorized to see.
 *
 * @param req The HTTP request
 * @param res The HTTP response
 */
async function handleUserInfo(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Handle user authorization
  const {
    query: { token, id },
    headers,
  } = req;

  //
  // Check if request header contains token
  // TODO: Figure out how to handle the string | string[] mess.
  const userToken = (token as string) || (headers['authorization'] as string);

  // TODO: Extract from bearer token
  // Probably not safe
  const isAuthorized = await userIsAuthorized(userToken, id as string);
  if (!isAuthorized) {
    return res.status(401).send({
      type: 'request-unauthorized',
      message: 'Request is not authorized to perform admin functionality.',
    });
  }

  const userID = id as string;

  try {
    // 首先通过 UID 查找用户
    let snapshot = await db.collection(REGISTRATION_COLLECTION).doc(userID).get();

    if (!snapshot.exists) {
      // 如果通过 UID 找不到，尝试获取用户的 email 并通过 email 查找
      console.log('[/api/userinfo] User not found by UID, trying to find by email...');

      try {
        // 从 Firebase Auth token 中获取 email
        const payload = await auth().verifyIdToken(userToken);
        const userEmail = payload.email;

        if (userEmail) {
          console.log('[/api/userinfo] Searching for email:', userEmail);

          // 通过 email 查找用户（检查多个字段）
          const emailQuery1 = await db
            .collection(REGISTRATION_COLLECTION)
            .where('email', '==', userEmail)
            .limit(1)
            .get();

          if (!emailQuery1.empty) {
            const existingDoc = emailQuery1.docs[0];
            const existingData = existingDoc.data();

            console.log('[/api/userinfo] Found existing user by email, migrating to new UID...');

            // 将现有用户数据复制到新的 UID
            await db
              .collection(REGISTRATION_COLLECTION)
              .doc(userID)
              .set(
                {
                  ...existingData,
                  id: userID,
                  migratedFrom: existingDoc.id,
                  migratedAt: firestore.FieldValue.serverTimestamp(),
                },
                { merge: true },
              );

            // 同时更新 users collection
            await db
              .collection('users')
              .doc(userID)
              .set(
                {
                  ...existingData,
                  id: userID,
                  user: {
                    ...(existingData.user || {}),
                    id: userID,
                  },
                  migratedFrom: existingDoc.id,
                  migratedAt: firestore.FieldValue.serverTimestamp(),
                },
                { merge: true },
              );

            // 重新获取刚创建的用户数据
            snapshot = await db.collection(REGISTRATION_COLLECTION).doc(userID).get();

            console.log('[/api/userinfo] ✅ User data migrated successfully');
          } else {
            // 尝试通过 preferredEmail 查找
            const emailQuery2 = await db
              .collection(REGISTRATION_COLLECTION)
              .where('preferredEmail', '==', userEmail)
              .limit(1)
              .get();

            if (!emailQuery2.empty) {
              const existingDoc = emailQuery2.docs[0];
              const existingData = existingDoc.data();

              console.log(
                '[/api/userinfo] Found existing user by preferredEmail, migrating to new UID...',
              );

              // 将现有用户数据复制到新的 UID
              await db
                .collection(REGISTRATION_COLLECTION)
                .doc(userID)
                .set(
                  {
                    ...existingData,
                    id: userID,
                    migratedFrom: existingDoc.id,
                    migratedAt: firestore.FieldValue.serverTimestamp(),
                  },
                  { merge: true },
                );

              // 同时更新 users collection
              await db
                .collection('users')
                .doc(userID)
                .set(
                  {
                    ...existingData,
                    id: userID,
                    user: {
                      ...(existingData.user || {}),
                      id: userID,
                    },
                    migratedFrom: existingDoc.id,
                    migratedAt: firestore.FieldValue.serverTimestamp(),
                  },
                  { merge: true },
                );

              // 重新获取刚创建的用户数据
              snapshot = await db.collection(REGISTRATION_COLLECTION).doc(userID).get();

              console.log('[/api/userinfo] ✅ User data migrated successfully');
            }
          }
        }
      } catch (tokenError) {
        console.error('[/api/userinfo] Error verifying token or migrating user:', tokenError);
      }
    }

    if (!snapshot.exists) {
      return res.status(404).json({ code: 'not found', message: "User doesn't exist..." });
    }

    res.status(200).json(snapshot.data());
  } catch (error) {
    console.error('Error when fetching applications', error);
    res.status(500).json({
      code: 'internal-error',
      message: 'Something went wrong when processing this request. Try again later.',
    });
  }
}

type ApplicationsResponse = {};

/**
 * Fetches scantype data.
 *
 * Corresponds to /api/scantypes route.
 */
export default async function handleScanTypes(
  req: NextApiRequest,
  res: NextApiResponse<ApplicationsResponse>,
) {
  const { method } = req;

  if (method === 'GET') {
    handleUserInfo(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
