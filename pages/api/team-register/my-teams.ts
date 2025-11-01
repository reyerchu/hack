import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import firebase from 'firebase-admin';

initializeApi();
const db = firebase.firestore();

/**
 * API endpoint to get all teams for the current user
 *
 * GET /api/team-register/my-teams
 *
 * Returns all teams where the user is either:
 * - Team leader
 * - Team member
 *
 * Response:
 * {
 *   data: [{
 *     id: string,
 *     teamName: string,
 *     teamLeader: {...},
 *     teamMembers: [...],
 *     tracks: [...],
 *     challenges: [...],
 *     status: string,
 *     myRole: string,
 *     canEdit: boolean,
 *     createdAt: timestamp,
 *     updatedAt: timestamp
 *   }]
 * }
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await firebase.auth().verifyIdToken(token);

    if (!decodedToken || !decodedToken.uid) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decodedToken.uid;

    // Get user email
    const userDoc = await db.collection('registrations').doc(userId).get();
    let userEmail = '';

    if (userDoc.exists) {
      const userData = userDoc.data();
      userEmail = userData?.user?.preferredEmail || '';
    }

    if (!userEmail) {
      // Try to get from auth token
      userEmail = decodedToken.email || '';
    }

    if (!userEmail) {
      return res.status(400).json({ error: '無法獲取用戶 Email' });
    }

    const normalizedEmail = userEmail.toLowerCase();

    // Find all teams where user is leader
    // Note: We'll sort in memory to avoid requiring a composite index
    const leaderTeamsSnapshot = await db
      .collection('team-registrations')
      .where('teamLeader.userId', '==', userId)
      .get();

    // Find all teams where user is a member (by email)
    const memberTeamsSnapshot = await db.collection('team-registrations').get(); // We'll filter in memory since we need to check array

    const teams: any[] = [];
    const processedTeamIds = new Set<string>();

    // Helper function to get all challenges for a team's tracks
    const getChallengesForTracks = async (trackIds: string[]) => {
      if (!trackIds || trackIds.length === 0) return [];

      const allChallenges: any[] = [];
      
      for (const trackId of trackIds) {
        try {
          // Get challenges for this track
          const challengesSnapshot = await db
            .collection('extended-challenges')
            .where('trackId', '==', trackId)
            .where('status', '==', 'published')
            .get();

          challengesSnapshot.docs.forEach((doc) => {
            const challengeData = doc.data();
            allChallenges.push({
              id: doc.id,
              title: challengeData.title || challengeData.name,
              description: challengeData.description || '',
              trackId: challengeData.trackId,
              submissionRequirements: challengeData.submissionRequirements || [],
              prizes: challengeData.prizes || [],
              evaluationCriteria: challengeData.evaluationCriteria || [],
            });
          });
        } catch (error) {
          console.error(`[GetMyTeams] Error getting challenges for track ${trackId}:`, error);
        }
      }

      return allChallenges;
    };

    // Process leader teams
    for (const doc of leaderTeamsSnapshot.docs) {
      const data = doc.data();
      processedTeamIds.add(doc.id);

      // Get track IDs
      const trackIds = (data.tracks || []).map((t: any) => t.id);
      
      // Get all challenges for these tracks
      const challenges = await getChallengesForTracks(trackIds);

      teams.push({
        id: doc.id,
        teamName: data.teamName,
        teamLeader: data.teamLeader,
        teamMembers: data.teamMembers || [],
        tracks: data.tracks || [],
        challenges: challenges,
        status: data.status || 'active',
        myRole: data.teamLeader.role,
        canEdit: data.teamLeader.hasEditRight !== false,
        isLeader: true,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    }

    // Process member teams
    for (const doc of memberTeamsSnapshot.docs) {
      // Skip if already processed as leader
      if (processedTeamIds.has(doc.id)) continue;

      const data = doc.data();
      const teamMembers = data.teamMembers || [];

      // Check if user is in team members
      const memberInfo = teamMembers.find(
        (m: any) => m.email && m.email.toLowerCase() === normalizedEmail,
      );

      if (memberInfo) {
        // Get track IDs
        const trackIds = (data.tracks || []).map((t: any) => t.id);
        
        // Get all challenges for these tracks
        const challenges = await getChallengesForTracks(trackIds);

        teams.push({
          id: doc.id,
          teamName: data.teamName,
          teamLeader: data.teamLeader,
          teamMembers: data.teamMembers || [],
          tracks: data.tracks || [],
          challenges: challenges,
          status: data.status || 'active',
          myRole: memberInfo.role,
          canEdit: memberInfo.hasEditRight === true,
          isLeader: false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      }
    }

    // Sort by createdAt descending (newest first)
    teams.sort((a, b) => {
      const aTime = a.createdAt?._seconds || 0;
      const bTime = b.createdAt?._seconds || 0;
      return bTime - aTime;
    });

    console.log(`[GetMyTeams] Found ${teams.length} teams for user ${userId}`);

    return res.status(200).json({
      data: teams,
    });
  } catch (error: any) {
    console.error('[GetMyTeams] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
