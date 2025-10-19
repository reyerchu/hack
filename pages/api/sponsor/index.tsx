import { firestore } from 'firebase-admin';
import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';

initializeApi();

const SPONSORS = '/sponsors';

/**
 *
 * API endpoint to get data of keynote speakers from backend for the keynote speakers section in home page
 *
 * @param req HTTP request object
 * @param res HTTP response object
 *
 *
 */
async function getSponsors(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 檢查 Firebase 是否已初始化
    try {
      const db = firestore();
      if (!db) {
        console.warn('Firebase not initialized, returning empty array for sponsors');
        return res.json([]);
      }
    } catch (error) {
      console.warn('Firebase not initialized, returning empty array for sponsors');
      return res.json([]);
    }

    const db = firestore();
    const snapshot = await db.collection(SPONSORS).get();
    let data = [];
    snapshot.forEach((doc) => {
      data.push(doc.data());
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    res.json([]);
  }
}

function handleGetRequest(req: NextApiRequest, res: NextApiResponse) {
  return getSponsors(req, res);
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
