import { NextApiRequest, NextApiResponse } from 'next';
import { auth, firestore } from 'firebase-admin';
import initializeApi from '../../../lib/admin/init';
import { userIsAuthorized } from '../../../lib/authorization/check-authorization';

initializeApi();

const db = firestore();

const APPLICATIONS_COLLECTION = '/registrations';
const MISC_COLLECTION = '/miscellaneous';

async function updateAllUsersDoc(userId: string, profile: any) {
  const docRef = db.collection(MISC_COLLECTION).doc('allusers');
  const userData = await docRef.get();

  const newUser = {
    id: profile.id,
    user: {
      firstName: profile.user.firstName,
      lastName: profile.user.lastName,
      permissions: profile.user.permissions,
    },
  };

  if (!userData.exists) {
    // Create the document if it doesn't exist
    await docRef.set({
      users: [newUser],
    });
  } else {
    // Append to existing users array
    await docRef.set({
      users: [...(userData.data()?.users || []), newUser],
    });
  }
}

/**
 * Handles GET requests to /api/applications.
 *
 * This returns all applications the user is authorized to see.
 *
 * @param req The HTTP request
 * @param res The HTTP response
 */
async function handleGetApplications(req: NextApiRequest, res: NextApiResponse) {
  // TODO: Handle user authorization
  const {
    query: { token },
    headers,
  } = req;

  //
  // Check if request header contains token
  // TODO: Figure out how to handle the string | string[] mess.
  const userToken = (token as string) || (headers['authorization'] as string);
  // TODO: Extract from bearer token
  // Probably not safe
  const isAuthorized = await userIsAuthorized(userToken, ['super_admin', 'admin']);

  if (!isAuthorized) {
    return res.status(401).send({
      type: 'request-unauthorized',
      message: 'Request is not authorized to perform admin functionality.',
    });
  }

  try {
    const snapshot = await db.collection(APPLICATIONS_COLLECTION).get();
    const applications: Registration[] = snapshot.docs.map((snap) => {
      // TODO: Verify the application is accurate and report if something is off
      return snap.data() as Registration;
    });
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error when fetching applications', error);
    res.status(500).json({
      code: 'internal-error',
      message: 'Something went wrong when processing this request. Try again later.',
    });
  }
}

/**
 * Handles POST requests to /api/applications.
 *
 * This creates a new application in the database using information given in the
 * request. If a user is not signed in, this route will return a 403
 * Unauthenticated error.
 *
 * @param req The HTTP request
 * @param res The HTTP response
 */
async function handlePostApplications(req: NextApiRequest, res: NextApiResponse) {
  const {} = req.query;
  const applicationBody = req.body;

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
    const snapshot = await db
      .collection(APPLICATIONS_COLLECTION)
      .where('user.id', '==', body.user.id)
      .get();

    if (!snapshot.empty) {
      console.log(`Profile already exists for user: ${body.user.id}`);
      return res.status(400).json({
        msg: 'Profile already exists',
      });
    }

    // Add timestamp when creating registration
    const registrationData = {
      ...body,
      timestamp: Date.now(), // Add current timestamp in milliseconds
    };

    await db.collection(APPLICATIONS_COLLECTION).doc(body.user.id).set(registrationData);
    await updateAllUsersDoc(body.user.id, body);
    console.log(
      `Successfully created profile for user: ${body.user.id} with timestamp: ${registrationData.timestamp}`,
    );
    res.status(200).json({
      msg: 'Operation completed',
    });
  } catch (error) {
    console.error('Error creating application:', error);
    return res.status(500).json({
      type: 'internal-error',
      message: 'Failed to create application',
      error: error.message,
    });
  }
}

type ApplicationsResponse = {};

/**
 * Fetches application data.
 *
 * Corresponds to /api/applications route.
 */
export default async function handleApplications(
  req: NextApiRequest,
  res: NextApiResponse<ApplicationsResponse>,
) {
  const { method } = req;

  if (method === 'GET') {
    return handleGetApplications(req, res);
  } else if (method === 'POST') {
    return handlePostApplications(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
