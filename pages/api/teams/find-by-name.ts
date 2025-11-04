/**
 * API: 根据团队名称查找团队 ID
 * GET /api/teams/find-by-name?name=teamName
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import admin from 'firebase-admin';

initializeApi();
const db = admin.firestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, names } = req.query;

    // 单个团队名称查询
    if (name && typeof name === 'string') {
      const snapshot = await db
        .collection('team-registrations')
        .where('teamName', '==', name)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'Team not found', name });
      }

      const team = snapshot.docs[0];
      return res.status(200).json({
        name,
        teamId: team.id,
        teamName: team.data().teamName,
      });
    }

    // 多个团队名称批量查询
    if (names) {
      const nameList = typeof names === 'string' ? [names] : names;
      const results: { [key: string]: string } = {};
      const notFound: string[] = [];

      for (const teamName of nameList) {
        const snapshot = await db
          .collection('team-registrations')
          .where('teamName', '==', teamName)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          results[teamName] = snapshot.docs[0].id;
        } else {
          notFound.push(teamName);
        }
      }

      return res.status(200).json({
        found: Object.keys(results).length,
        total: nameList.length,
        results,
        notFound,
      });
    }

    return res.status(400).json({ error: 'Missing name or names parameter' });
  } catch (error) {
    console.error('[API /teams/find-by-name] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
