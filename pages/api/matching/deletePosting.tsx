import { firestore, auth } from 'firebase-admin';
import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import { userIsAuthorized } from '../../../lib/authorization/check-authorization';

initializeApi();
const db = firestore();
const POSTINGS_COLLECTION = '/postings';

interface PostingData {
  authorId: string;
  postingId: string;
}

async function deletePosting(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const postingData: PostingData = JSON.parse(req.body);
    const snapshot = await db.collection(POSTINGS_COLLECTION).doc(postingData.postingId).get();

    if (!snapshot.exists) {
      return res.status(404).json({
        msg: 'Posting not found',
      });
    }

    if (snapshot.data().authorId !== userId) {
      return res.status(403).json({
        msg: 'User unauthorized to delete this posting because they are not the author',
      });
    }

    await db.collection(POSTINGS_COLLECTION).doc(postingData.postingId).delete();

    return res.status(200).json({
      msg: 'Posting deleted',
    });
  } catch (error) {
    return res.status(500).json({
      msg: 'Unexpected error. Please try again later',
    });
  }
}

async function handleDeletionRequest(req: NextApiRequest, res: NextApiResponse) {
  const userToken = req.headers['authorization'] as string;
  const isAuthorized = await userIsAuthorized(userToken, ['hacker']);
  const userId = await auth().verifyIdToken(userToken);

  if (!isAuthorized) {
    return res.status(403).json({
      msg: 'Request is not allowed to perform hacker functionality',
    });
  }

  return deletePosting(req, res, userId.uid);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  switch (method) {
    case 'POST': {
      return handleDeletionRequest(req, res);
    }
    default: {
      return res.status(404).json({
        msg: 'Route not found',
      });
    }
  }
}
