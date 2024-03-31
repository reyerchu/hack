import { firestore } from 'firebase-admin';
import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../lib/admin/init';
import { userIsAuthorized } from '../../lib/authorization/check-authorization';

initializeApi();
const db = firestore();
const POSTINGS_COLLECTION = '/postings';

interface PostingData {
  postingId: string;
}

// Define an asynchronous function to retrieve all postings from the database.
async function getAllPostings(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Attempt to get all documents from the 'POSTINGS_COLLECTION' in Firestore.
    const postingsSnapshot = await db.collection(POSTINGS_COLLECTION).get();

    // Transform the documents snapshot into an array of objects. Each object contains
    // the document ID and the document's data (fields like numberOfPeopleWanted, skillSet, etc.).
    const postings = postingsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Return a 200 OK status with the array of postings as JSON. This response
    // includes all postings currently in the 'POSTINGS_COLLECTION'.
    return res.status(200).json(postings);
  } catch (error) {
    // If an error occurs during the process of retrieving or processing the postings,
    // log the error to the console for debugging purposes and return a 500 Internal Server
    // Error status with an error message.
    console.error('Error retrieving postings:', error);
    return res.status(500).json({ msg: 'Internal server error' });
  }
}

async function handleRequest(req: NextApiRequest, res: NextApiResponse) {
  const userToken = req.headers['authorization'] as string;
  const isAuthorized = await userIsAuthorized(userToken, ['hacker']);
  if (!isAuthorized) {
    return res.status(403).json({
      msg: 'Request is not allowed to perform this functionality',
    });
  }

  return getAllPostings(req, res);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  switch (method) {
    case 'GET': {
      return handleRequest(req, res);
    }
    default: {
      return res.status(404).json({
        msg: 'Route not found',
      });
    }
  }
}
