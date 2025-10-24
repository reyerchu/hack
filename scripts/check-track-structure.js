// Check track structure for imtoken
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match && match[1].startsWith('SERVICE_ACCOUNT_')) {
    process.env[match[1]] = match[2];
  }
});

// Initialize Firebase
if (!admin.apps.length) {
  let privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY;
  if (privateKey && (privateKey.startsWith('"') || privateKey.startsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = admin.firestore();

async function checkTrack() {
  const trackId = 'imtoken-賽道-135870';

  console.log(`\n=== Checking Track: ${trackId} ===\n`);

  // 1. Try to find by trackId field
  console.log('Method 1: Query by trackId field...');
  const byFieldQuery = await db.collection('tracks').where('trackId', '==', trackId).get();

  console.log(`  Found ${byFieldQuery.size} document(s)\n`);

  if (!byFieldQuery.empty) {
    byFieldQuery.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`  Document ID: ${doc.id}`);
      console.log(`  Track ID field: ${data.trackId}`);
      console.log(`  Sponsor ID: ${data.sponsorId}`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Status: ${data.status}\n`);
    });
  }

  // 2. Try to find by document ID
  console.log('Method 2: Get by document ID...');
  const byDocId = await db.collection('tracks').doc(trackId).get();

  if (byDocId.exists) {
    const data = byDocId.data();
    console.log(`  ✅ Document exists!`);
    console.log(`  Document ID: ${byDocId.id}`);
    console.log(`  Track ID field: ${data.trackId}`);
    console.log(`  Sponsor ID: ${data.sponsorId}`);
    console.log(`  Name: ${data.name}`);
    console.log(`  Status: ${data.status}\n`);
  } else {
    console.log(`  ❌ Document not found\n`);
  }

  // 3. Find all imToken tracks
  console.log('Method 3: Find all imToken tracks...');
  const imtokenTracks = await db
    .collection('tracks')
    .where('sponsorId', '==', 'sponsor-imtoken')
    .get();

  console.log(`  Found ${imtokenTracks.size} imToken track(s):\n`);

  imtokenTracks.docs.forEach((doc, idx) => {
    const data = doc.data();
    console.log(`  ${idx + 1}. Document ID: ${doc.id}`);
    console.log(`     Track ID field: ${data.trackId}`);
    console.log(`     Name: ${data.name}`);
    console.log(`     Status: ${data.status}\n`);
  });

  // 4. Check the challenge
  console.log('Method 4: Check challenge 2I3wWp7VG9YRmYY2yeOH...');
  const challengeDoc = await db.collection('extended-challenges').doc('2I3wWp7VG9YRmYY2yeOH').get();

  if (challengeDoc.exists) {
    const challenge = challengeDoc.data();
    console.log(`  Challenge trackId: ${challenge.trackId}`);
    console.log(`  Challenge sponsorId: ${challenge.sponsorId}`);

    // Try to find track by challenge's trackId
    console.log(`\n  Looking for track with trackId='${challenge.trackId}'...`);
    const trackByChallenge = await db
      .collection('tracks')
      .where('trackId', '==', challenge.trackId)
      .where('sponsorId', '==', 'sponsor-imtoken')
      .get();

    console.log(`  Found ${trackByChallenge.size} matching track(s)`);

    if (!trackByChallenge.empty) {
      const track = trackByChallenge.docs[0].data();
      console.log(`  ✅ Track found!`);
      console.log(`     Document ID: ${trackByChallenge.docs[0].id}`);
      console.log(`     Name: ${track.name}`);
    }
  }
}

checkTrack()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
