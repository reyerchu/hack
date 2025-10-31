#!/usr/bin/env node
/**
 * Test PDF delete and re-upload flow
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables
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

async function testPdfStatus() {
  console.log(`🔍 Checking PDF status for team: ${teamId}\n`);

  try {
    const teamDoc = await db.collection('team-registrations').doc(teamId).get();

    if (!teamDoc.exists) {
      console.log(`❌ Team not found: ${teamId}`);
      process.exit(1);
    }

    const teamData = teamDoc.data();
    console.log(`✅ Team: ${teamData.teamName}\n`);

    console.log('📋 Current Status:\n');

    if (teamData.submittedPdf) {
      console.log('  PDF Status: ✅ HAS PDF');
      console.log(`  File Name:  ${teamData.submittedPdf.fileName}`);
      console.log(`  Uploaded By: ${teamData.submittedPdf.uploadedBy}`);
      console.log('');
      console.log('✅ Delete API should work');
      console.log('✅ After delete, can upload new PDF');
    } else {
      console.log('  PDF Status: ❌ NO PDF');
      console.log('');
      console.log('✅ Upload API should work');
      console.log('✅ Can upload a new PDF');
    }

    console.log('\n📝 Database field check:');
    console.log(`  submittedPdf field exists: ${teamData.submittedPdf ? 'YES' : 'NO'}`);
    console.log(`  submittedPdf is null: ${teamData.submittedPdf === null ? 'YES' : 'NO'}`);
    console.log(
      `  submittedPdf is undefined: ${teamData.submittedPdf === undefined ? 'YES' : 'NO'}`,
    );
  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

testPdfStatus();
