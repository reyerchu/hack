import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeApi } from '../../../lib/admin/init';

initializeApi();
const db = require('../../../lib/admin/firebase').db;

/**
 * API endpoint to get all team registrations for admin
 * 
 * GET /api/admin/teams
 * - Returns all team registrations with expanded user information
 * 
 * Authorization: Requires super_admin permission
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Add authentication check
    // const user = await verifyAuthToken(req);
    // if (!user || !user.permissions.includes('super_admin')) {
    //   return res.status(403).json({ error: '權限不足' });
    // }

    console.log('[GET /api/admin/teams] Fetching all team registrations');

    // Fetch all team registrations
    const teamsSnapshot = await db.collection('team-registrations').get();

    if (teamsSnapshot.empty) {
      console.log('[GET /api/admin/teams] No teams found');
      return res.status(200).json({ data: [] });
    }

    const teams = [];
    
    for (const doc of teamsSnapshot.docs) {
      const teamData = doc.data();
      
      // Fetch team leader info
      let leaderInfo = null;
      if (teamData.teamLeader?.userId) {
        try {
          const userSnapshot = await db.collection('registrations').doc(teamData.teamLeader.userId).get();
          if (userSnapshot.exists) {
            const userData = userSnapshot.data();
            leaderInfo = {
              ...teamData.teamLeader,
              firstName: userData.user?.firstName || '',
              lastName: userData.user?.lastName || '',
              preferredEmail: userData.user?.preferredEmail || userData.user?.email || teamData.teamLeader.email,
            };
          }
        } catch (error) {
          console.error('[GET /api/admin/teams] Error fetching leader info:', error);
        }
      }

      // Fetch track names
      const trackNames = [];
      if (teamData.tracks && Array.isArray(teamData.tracks)) {
        for (const trackId of teamData.tracks) {
          try {
            // Try tracks collection first
            let trackDoc = await db.collection('tracks').doc(trackId).get();
            if (trackDoc.exists) {
              trackNames.push(trackDoc.data().name || trackId);
            } else {
              // Fallback to extended-sponsors
              trackDoc = await db.collection('extended-sponsors').doc(trackId).get();
              if (trackDoc.exists) {
                trackNames.push(trackDoc.data().name || trackId);
              } else {
                trackNames.push(trackId);
              }
            }
          } catch (error) {
            console.error('[GET /api/admin/teams] Error fetching track:', error);
            trackNames.push(trackId);
          }
        }
      }

      teams.push({
        id: doc.id,
        teamName: teamData.teamName,
        teamLeader: leaderInfo || teamData.teamLeader,
        teamMembers: teamData.teamMembers || [],
        tracks: trackNames,
        trackIds: teamData.tracks || [],
        createdAt: teamData.createdAt,
        updatedAt: teamData.updatedAt,
      });
    }

    // Sort by creation date (newest first)
    teams.sort((a, b) => {
      const timeA = a.createdAt?._seconds || 0;
      const timeB = b.createdAt?._seconds || 0;
      return timeB - timeA;
    });

    console.log(`[GET /api/admin/teams] Found ${teams.length} teams`);
    return res.status(200).json({ data: teams });

  } catch (error: any) {
    console.error('[GET /api/admin/teams] Error:', error);
    return res.status(500).json({ error: error.message || '獲取團隊列表失敗' });
  }
}

