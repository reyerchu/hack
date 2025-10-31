#!/usr/bin/env node
/**
 * Check if a team has uploaded PDF
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      process.env[key] = values.join('=');
    }
  });
}

// Initialize Firebase Admin
if (admin.apps.length < 1) {
  let privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ SERVICE_ACCOUNT_PRIVATE_KEY is missing');
    process.exit(1);
  }

  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }

  privateKey = privateKey.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = admin.firestore();
const teamId = process.argv[2] || 'ZIohfRxsiGcBocIrvBHf';

async function checkTeamPdf() {
  console.log(`🔍 Checking PDF for team: ${teamId}\n`);

  try {
    const teamDoc = await db.collection('team-registrations').doc(teamId).get();

    if (!teamDoc.exists) {
      console.log(`❌ Team not found: ${teamId}`);
      process.exit(1);
    }

    const teamData = teamDoc.data();
    console.log(`✅ Team found: ${teamData.teamName}\n`);

    if (teamData.submittedPdf) {
      console.log('📄 PDF Status: ✅ UPLOADED\n');
      console.log('File Details:');
      console.log(`  File Name:    ${teamData.submittedPdf.fileName || 'N/A'}`);
      console.log(`  File URL:     ${teamData.submittedPdf.fileUrl || 'N/A'}`);
      console.log(`  Uploaded By:  ${teamData.submittedPdf.uploadedBy || 'N/A'}`);

      if (teamData.submittedPdf.uploadedAt) {
        const uploadTime = teamData.submittedPdf.uploadedAt.toDate
          ? teamData.submittedPdf.uploadedAt.toDate()
          : new Date(teamData.submittedPdf.uploadedAt);
        console.log(`  Uploaded At:  ${uploadTime.toLocaleString('zh-TW')}`);
      }

      console.log('\n✅ The UI SHOULD show file info with delete button');
    } else {
      console.log('📄 PDF Status: ❌ NOT UPLOADED\n');
      console.log('✅ The UI SHOULD show upload button');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

checkTeamPdf();
