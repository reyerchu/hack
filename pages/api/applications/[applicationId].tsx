import { NextApiRequest, NextApiResponse } from 'next';
import { auth, firestore } from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';
import { userIsAuthorized } from '../../../lib/authorization/check-authorization';

initializeApi();

const db = firestore();

const APPLICATIONS_COLLECTION = '/registrations';
const USERS_COLLECTION = '/users';
const MISC_COLLECTION = '/miscellaneous';

async function updateAllUsersDoc(userId: string, profile: any) {
  const docRef = db.collection(MISC_COLLECTION).doc('allusers');
  const userData = await docRef.get();

  const updatedUser = {
    id: profile.id,
    user: {
      firstName: profile.user.firstName,
      lastName: profile.user.lastName,
      permissions: profile.user.permissions,
    },
  };

  if (userData.exists) {
    const users = userData.data()?.users || [];
    const userIndex = users.findIndex((u: any) => u.id === userId);

    if (userIndex !== -1) {
      users[userIndex] = updatedUser;
      await docRef.set({ users });
    }
  }
}

function extractHeaderToken(input: string) {
  const result = input;
  return result;
}

/**
 * Handles GET requests to /api/application/<id>.
 *
 * This returns the application the authorized user wants to see.
 *
 * @param req The HTTP request
 * @param res The HTTP response
 */
async function handleGetApplication(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Handle user authorization
  const {
    query: { token, id },
    headers,
  } = req;

  //
  // Check if request header contains token
  // TODO: Figure out how to handle the string | string[] mess.
  const userToken = (token as string) || (headers['authorization'] as string);

  const isAuthorized = await userIsAuthorized(userToken);

  // TODO: Extract from bearer token
  // Probably not safe
  if (!isAuthorized) {
    return res.status(401).send({
      type: 'request-unauthorized',
      message: 'Request is not authorized to perform admin functionality.',
    });
  }
  const userID = id as string;

  try {
    const application = await db.collection(APPLICATIONS_COLLECTION).doc(userID);
    const data = await application.get();
    if (!data.exists) {
      res.status(404).json({
        code: 'not-found',
        message: 'Application ID invalid, or the user is not registered.',
      });
    } else {
      res.status(200).json(data.data());
    }
  } catch (error) {
    console.error('Error when fetching applications', error);
    res.status(500).json({
      code: 'internal-error',
      message: 'Something went wrong when processing this request. Try again later.',
    });
  }
  return;
}

/**
 * Handles PUT requests to /api/applications/[applicationId].
 *
 * This updates an existing application.
 *
 * @param req The HTTP request
 * @param res The HTTP response
 */
async function handlePutApplication(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { applicationId },
  } = req;

  const userId = applicationId as string;

  let body: Registration;
  try {
    body = JSON.parse(req.body);
  } catch (error) {
    console.error('Could not parse request JSON body', error);
    return res.status(400).json({
      type: 'invalid',
      message: 'Invalid JSON format',
    });
  }

  try {
    // Verify the application exists
    const snapshot = await db.collection(APPLICATIONS_COLLECTION).doc(userId).get();

    if (!snapshot.exists) {
      return res.status(404).json({
        type: 'not-found',
        message: 'Application not found',
      });
    }

    // Update the application
    await db.collection(APPLICATIONS_COLLECTION).doc(userId).update(body);

    // Update the allusers doc
    await updateAllUsersDoc(userId, body);

    console.log(`Successfully updated profile for user: ${userId}`);
    res.status(200).json({
      msg: 'Profile updated successfully',
      data: body,
    });
  } catch (error) {
    console.error('Error updating application:', error);
    return res.status(500).json({
      type: 'internal-error',
      message: 'Failed to update application',
      error: error.message,
    });
  }
}

/**
 * Get application data.
 *
 * Corresponds to /api/applications/[applicationId] route;
 */
export default function handleApplications(req: NextApiRequest, res: NextApiResponse) {
  // Get /applications collection in Cloud Firestore
  // GET: Return this application
  // PUT: Modify an application
  // PATCH: Modify an application
  // DELETE: Delete this applications
  const { method } = req;
  if (method === 'GET') {
    return handleGetApplication(req, res);
  } else if (method === 'PUT') {
    return handlePutApplication(req, res);
  } else if (method === 'PATCH') {
  } else if (method === 'DELETE') {
    // Maybe check for additional authorization so only organizers can delete individual applications?
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
