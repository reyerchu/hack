import { firestore } from 'firebase-admin';
import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import { userIsAuthorized } from '../../../lib/authorization/check-authorization';

initializeApi();
const db = firestore();

// Enhanced function to get all users interested in a specific posting
async function getInterestedUsers(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Validate the input: ensure a postingId is provided
    const postingId = req.query.postingId as string;
    if (!postingId) {
      return res.status(400).json({ error: 'Posting ID must be provided.' });
    }

    // Reference to the interestedPeople sub-collection for the given postingId
    const interestedRef = db.collection('postings').doc(postingId).collection('interestedPeople');

    // Fetch the documents from the sub-collection
    const snapshot = await interestedRef.get();

    // If there are no interested users, return an empty array with a message
    if (snapshot.empty) {
      return res
        .status(404)
        .json({ message: 'No interested users found for this posting.', interestedUsers: [] });
    }

    // Map over the documents to extract the data
    const interestedUsers = snapshot.docs.map((doc) => {
      const userData = doc.data();
      return {
        name: userData.name,
        email: userData.email,
      };
    });

    // Return the list of interested users
    return res.status(200).json(interestedUsers);
  } catch (error) {
    console.error('Failed to retrieve interested users:', error);
    // Return a generic error message
    return res.status(500).json({ error: 'An error occurred while fetching interested users.' });
  }
}

async function handleGetRequest(req: NextApiRequest, res: NextApiResponse) {
  const userToken = req.headers['authorization'] as string;
  const isAuthorized = await userIsAuthorized(userToken, ['hacker']);
  if (!isAuthorized) {
    return res.status(403).json({
      msg: 'Request is not allowed to perform this functionality',
    });
  }
  return getInterestedUsers(req, res);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  switch (method) {
    case 'GET': {
      return handleGetRequest(req, res);
    }
    default: {
      return res.status(404).json({
        msg: 'Route not found',
      });
    }
  }
}
