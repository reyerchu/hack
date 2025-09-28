import { firestore } from 'firebase-admin';
import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';

initializeApi();

const FAQS_COLLECTION = '/faqs';

/**
 *
 * Fetch all FAQs from the database
 *
 * @param req request object
 * @param res response object
 *
 *
 */
async function getFaqs(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 检查 Firebase 是否已初始化
    try {
      const db = firestore();
      if (!db) {
        console.warn('Firebase not initialized, returning empty array for FAQs');
        return res.json([]);
      }
    } catch (error) {
      console.warn('Firebase not initialized, returning empty array for FAQs');
      return res.json([]);
    }

    const db = firestore();
    const snapshot = await db.collection(FAQS_COLLECTION).get();
    let data = [];
    snapshot.forEach((doc) => {
      data.push(doc.data());
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.json([]);
  }
}

function handleGetRequest(req: NextApiRequest, res: NextApiResponse) {
  return getFaqs(req, res);
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
