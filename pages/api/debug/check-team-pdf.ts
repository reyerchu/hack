import type { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../lib/admin/init';
import admin from 'firebase-admin';

initializeApi();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { teamId } = req.query;

    if (!teamId || typeof teamId !== 'string') {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    // 1. Check Firestore
    const teamDoc = await db.collection('team-registrations').doc(teamId).get();

    if (!teamDoc.exists) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamData = teamDoc.data()!;

    // 2. Check Firebase Storage
    const prefix = `team-pdfs/${teamId}/`;
    const [files] = await bucket.getFiles({ prefix });

    const storageFiles = await Promise.all(
      files.map(async (file) => {
        const [metadata] = await file.getMetadata();
        return {
          name: file.name,
          publicUrl: `https://storage.googleapis.com/${bucket.name}/${file.name}`,
          size: metadata.size,
          contentType: metadata.contentType,
          created: metadata.timeCreated,
        };
      }),
    );

    return res.status(200).json({
      teamName: teamData.teamName,
      firestorePdf: teamData.submittedPdf || null,
      storageFiles,
      match: storageFiles.some((f) => f.publicUrl === teamData.submittedPdf?.fileUrl),
    });
  } catch (error: any) {
    console.error('[Check Team PDF] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
