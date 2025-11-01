/**
 * API endpoint for uploading files to Firebase Storage
 * POST /api/upload-file
 * 
 * Uses Admin SDK to bypass client-side storage rules
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { firestore } from 'firebase-admin';
import initializeApi from '../../lib/admin/init';
import admin from 'firebase-admin';
import formidable from 'formidable';
import fs from 'fs';

initializeApi();
const db = firestore();

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Parse form data
    const form = formidable({ maxFileSize: 100 * 1024 * 1024 }); // 100MB max

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const teamId = Array.isArray(fields.teamId) ? fields.teamId[0] : fields.teamId;
    const challengeId = Array.isArray(fields.challengeId) ? fields.challengeId[0] : fields.challengeId;
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!teamId || !challengeId || !file) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify team exists (check team-registrations collection)
    const teamDoc = await db.collection('team-registrations').doc(teamId).get();
    if (!teamDoc.exists) {
      console.log(`[UploadFile] Team not found: ${teamId}`);
      return res.status(404).json({ error: 'Team not found' });
    }

    const teamData = teamDoc.data();
    
    // Verify user has permission for this team
    const userEmail = decodedToken.email?.toLowerCase();
    const isLeader = teamData?.teamLeader?.userId === userId || teamData?.teamLeader?.email?.toLowerCase() === userEmail;
    const isMember = teamData?.teamMembers?.some((m: any) => 
      m.email?.toLowerCase() === userEmail && m.hasEditRight === true
    );

    if (!isLeader && !isMember) {
      console.log(`[UploadFile] User ${userId} has no permission for team ${teamId}`);
      return res.status(403).json({ error: 'No permission to upload for this team' });
    }

    console.log(`[UploadFile] User ${userId} has permission for team ${teamId}`);

    // Upload file to Firebase Storage using Admin SDK
    const bucket = admin.storage().bucket();
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.originalFilename || 'file'}`;
    const destination = `team-submissions/${teamId}/${challengeId}/${fileName}`;
    
    // Read file buffer
    const fileBuffer = fs.readFileSync(file.filepath);
    
    // Upload to Storage
    const fileRef = bucket.file(destination);
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.mimetype || 'application/octet-stream',
        metadata: {
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Make file publicly readable (optional, adjust based on your needs)
    await fileRef.makePublic();

    // Get download URL
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    console.log(`[UploadFile] File uploaded: ${destination}`);

    return res.status(200).json({
      success: true,
      fileUrl: downloadURL,
      fileName: file.originalFilename,
      fileSize: file.size,
    });

  } catch (error: any) {
    console.error('[UploadFile] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to upload file',
    });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

