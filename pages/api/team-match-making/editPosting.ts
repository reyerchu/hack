import { firestore } from 'firebase-admin';
import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import { userIsAuthorized } from '../../../lib/authorization/check-authorization';

initializeApi();
const db = firestore();
const POSTINGS_COLLECTION = '/postings';

interface PostingData {
  postingId: string;
  numberOfPeopleWanted: number;
  skillSet: string;
}

// Define the function to edit a posting, which is asynchronous and takes a Next.js API request and response.
async function editPosting(req: NextApiRequest, res: NextApiResponse) {
  // Destructure and extract postingId, numberOfPeopleWanted, and skillSet from the request body.
  const { postingId, numberOfPeopleWanted, skillSet }: PostingData = req.body;

  // Validate the request body to ensure that postingId, numberOfPeopleWanted, and skillSet are provided.
  if (!postingId || numberOfPeopleWanted === undefined || !skillSet) {
    // If any required fields are missing, return a 400 status code and an error message.
    return res.status(400).json({ msg: 'Missing required fields' });
  }

  try {
    // Reference the specific posting document in the Firestore database using the postingId.
    const postingRef = db.collection(POSTINGS_COLLECTION).doc(postingId);
    // Attempt to retrieve the document from Firestore.
    const postingDoc = await postingRef.get();

    // Check if the document exists. If not, return a 404 status code and an error message.
    if (!postingDoc.exists) {
      return res.status(404).json({ msg: 'Posting not found' });
    }

    // If the document exists, update it with the new numberOfPeopleWanted and skillSet values.
    await postingRef.update({
      numberOfPeopleWanted,
      skillSet,
    });

    // After updating, retrieve the updated document to include in the response.
    const updatedDoc = await postingRef.get();
    // Return a 200 status code, success message, and the updated posting data.
    return res
      .status(200)
      .json({ msg: 'Posting updated successfully', posting: updatedDoc.data() });
  } catch (error) {
    // If an error occurs during the process, log the error and return a 500 status code with an error message.
    console.error('Error updating posting:', error);
    return res.status(500).json({ msg: 'Internal server error' });
  }
}

async function handlePostRequest(req: NextApiRequest, res: NextApiResponse) {
  const userToken = req.headers['authorization'] as string;
  const isAuthorized = await userIsAuthorized(userToken, ['hacker']);
  if (!isAuthorized) {
    return res.status(403).json({
      msg: 'Request is not allowed to perform hacker functionality',
    });
  }

  return editPosting(req, res);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  switch (method) {
    case 'POST': {
      return handlePostRequest(req, res);
    }
    default: {
      return res.status(404).json({
        msg: 'Route not found',
      });
    }
  }
}
