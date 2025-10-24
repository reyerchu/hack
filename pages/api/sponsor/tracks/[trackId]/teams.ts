/**
 * API endpoint to get teams registered for a specific track
 * GET /api/sponsor/tracks/[trackId]/teams
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../../../../lib/admin/init';
import { requireAuth, ApiResponse, AuthenticatedRequest } from '../../../../../lib/sponsor/middleware';
import { checkTrackAccess } from '../../../../../lib/sponsor/permissions';

initializeApi();
const db = firestore();

interface TeamMember {
  email: string;
  role: string;
  hasEditRight: boolean;
  name?: string;
  firstName?: string;
  lastName?: string;
}

interface TeamLeader {
  userId: string;
  email: string;
  role: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  preferredEmail?: string;
}

interface Team {
  id: string;
  teamName: string;
  teamLeader: TeamLeader;
  teamMembers: TeamMember[];
  tracks: Array<{ id: string; name: string }>;
  trackIds: string[];
  createdAt: any;
  updatedAt: any;
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  console.log('[GET /api/sponsor/tracks/[trackId]/teams] Request started');

  if (!(await requireAuth(req, res))) return;

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const { trackId } = req.query;

  if (!trackId || typeof trackId !== 'string') {
    return ApiResponse.error(res, 'Invalid track ID', 400);
  }

  try {
    console.log('[GET teams] Checking access for user:', userId, 'track:', trackId);

    // Check if user has access to this track
    const canAccess = await checkTrackAccess(userId, trackId);

    if (!canAccess) {
      return ApiResponse.forbidden(res, 'You do not have permission to view teams for this track');
    }

    // Get the track document ID (trackId might be the field value or document ID)
    let trackDocId = trackId;
    
    // Try to find track by trackId field first
    const trackQuery = await db
      .collection('tracks')
      .where('trackId', '==', trackId)
      .limit(1)
      .get();
    
    if (!trackQuery.empty) {
      trackDocId = trackQuery.docs[0].id;
    }

    console.log('[GET teams] Track document ID:', trackDocId);

    // Fetch all team registrations
    const teamsSnapshot = await db
      .collection('team-registrations')
      .where('status', '==', 'active')
      .get();

    console.log('[GET teams] Total teams:', teamsSnapshot.size);

    // Filter teams that have this track
    const teams: Team[] = [];

    for (const teamDoc of teamsSnapshot.docs) {
      const teamData = teamDoc.data();
      
      // Check if team has this track (tracks is an array of objects with id field)
      const hasTrack = teamData.tracks?.some((track: any) => 
        track.id === trackDocId || track.id === trackId
      );

      if (!hasTrack) continue;

      // Get team leader details (data is already in teamLeader object)
      let teamLeader: TeamLeader = {
        userId: teamData.teamLeader?.userId || '',
        email: teamData.teamLeader?.email || '',
        preferredEmail: teamData.teamLeader?.email || '',
        name: teamData.teamLeader?.name || '',
        firstName: teamData.teamLeader?.name?.split(' ')[0] || '',
        lastName: teamData.teamLeader?.name?.split(' ').slice(1).join(' ') || '',
        role: teamData.teamLeader?.role || 'leader',
      };

      // Get team members details (data is already in teamMembers array)
      const teamMembers: TeamMember[] = [];
      
      if (Array.isArray(teamData.teamMembers)) {
        for (const member of teamData.teamMembers) {
          teamMembers.push({
            email: member.email || '',
            name: member.name || '',
            firstName: member.name?.split(' ')[0] || '',
            lastName: member.name?.split(' ').slice(1).join(' ') || '',
            role: member.role || 'member',
            hasEditRight: member.hasEditRight || false,
          });
        }
      }

      teams.push({
        id: teamDoc.id,
        teamName: teamData.teamName || '',
        teamLeader,
        teamMembers,
        tracks: teamData.tracks || [],
        trackIds: (teamData.tracks || []).map((t: any) => t.id),
        createdAt: teamData.createdAt,
        updatedAt: teamData.updatedAt,
      });
    }

    console.log('[GET teams] Teams for this track:', teams.length);

    return ApiResponse.success(res, teams);
  } catch (error: any) {
    console.error('[GET teams] Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to fetch teams', 500);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

