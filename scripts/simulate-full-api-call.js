// Simulate full API call for alphareyer@gmail.com editing challenge
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

// Simulate getUserData function
async function getUserData(userId) {
  const userQuery = await db
    .collection('registrations')
    .where('user.preferredEmail', '==', 'alphareyer@gmail.com')
    .limit(1)
    .get();

  if (userQuery.empty) return null;

  const userDoc = userQuery.docs[0];
  return {
    exists: true,
    data: userDoc.data(),
    ref: userDoc.ref,
  };
}

// Simulate checkTrackAccess function
async function checkTrackAccess(userId, trackId) {
  console.log('\n=== Simulating checkTrackAccess ===');
  console.log(`userId: ${userId}`);
  console.log(`trackId: ${trackId}`);

  // 1. Get user data
  const userData = await getUserData(userId);
  if (!userData || !userData.exists) {
    console.log('❌ User not found');
    return false;
  }

  const user = userData.data;
  const permissions = user?.permissions || user?.user?.permissions || [];
  console.log(`permissions: ${JSON.stringify(permissions)}`);

  // Admin check
  if (permissions.includes('admin') || permissions.includes('super_admin')) {
    console.log('✅ User is admin');
    return true;
  }

  // 2. Get sponsor mappings
  const docId = userData.ref.id;
  console.log(`docId: ${docId}`);

  const mappingsSnapshot = await db
    .collection('sponsor-user-mappings')
    .where('userId', '==', docId)
    .get();

  console.log(`mappings count: ${mappingsSnapshot.size}`);

  if (mappingsSnapshot.empty) {
    console.log('❌ No sponsor mappings');
    return false;
  }

  const sponsorIds = mappingsSnapshot.docs.map((doc) => doc.data().sponsorId);
  console.log(`sponsorIds: ${JSON.stringify(sponsorIds)}`);

  // 3. Check if sponsors own the track
  console.log(
    `\nQuerying tracks with trackId='${trackId}' AND sponsorId IN ${JSON.stringify(sponsorIds)}`,
  );

  const trackSnapshot = await db
    .collection('tracks')
    .where('trackId', '==', trackId)
    .where('sponsorId', 'in', sponsorIds)
    .limit(1)
    .get();

  console.log(`tracks found: ${trackSnapshot.size}`);

  if (!trackSnapshot.empty) {
    const track = trackSnapshot.docs[0].data();
    console.log(`✅ Track found: ${track.name}`);
    return true;
  } else {
    console.log('❌ Track not found');
    return false;
  }
}

// Simulate getUserSponsorRole function
async function getUserSponsorRole(userId, sponsorId) {
  console.log('\n=== Simulating getUserSponsorRole ===');
  console.log(`userId: ${userId}`);
  console.log(`sponsorId: ${sponsorId}`);

  const userData = await getUserData(userId);
  if (!userData || !userData.exists) {
    console.log('❌ User not found');
    return null;
  }

  const user = userData.data;
  const permissions = user?.permissions || user?.user?.permissions || [];

  if (permissions.includes('admin') || permissions.includes('super_admin')) {
    console.log('✅ User is system admin');
    return 'admin';
  }

  const docId = userData.ref.id;
  const mappingQuery = await db
    .collection('sponsor-user-mappings')
    .where('userId', '==', docId)
    .where('sponsorId', '==', sponsorId)
    .limit(1)
    .get();

  if (mappingQuery.empty) {
    console.log('❌ No mapping found');
    return null;
  }

  const mapping = mappingQuery.docs[0].data();
  console.log(`✅ Mapping found, role: ${mapping.role}`);
  return mapping.role;
}

async function simulateFullFlow() {
  const userId = 'YzxQ10RY2SNZhmKM4yO08So4EHS2';
  const trackId = 'imtoken-賽道-135870';
  const challengeId = '2I3wWp7VG9YRmYY2yeOH';

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Simulating Full API Call Flow                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  // Step 1: requireTrackAccess
  console.log('\n📝 Step 1: requireTrackAccess');
  const hasTrackAccess = await checkTrackAccess(userId, trackId);
  console.log(`\n✅ Result: ${hasTrackAccess ? 'PASS' : 'FAIL'}`);

  if (!hasTrackAccess) {
    console.log('\n❌❌❌ WOULD FAIL HERE: No access to this track ❌❌❌');
    return;
  }

  // Step 2: Get challenge and check sponsorId
  console.log('\n📝 Step 2: Get Challenge');
  const challengeDoc = await db.collection('extended-challenges').doc(challengeId).get();
  const challenge = challengeDoc.data();
  console.log(`Challenge sponsor: ${challenge.sponsorId}`);

  // Step 3: getUserSponsorRole
  const userRole = await getUserSponsorRole(userId, challenge.sponsorId);
  console.log(`\n✅ User role: ${userRole}`);

  // Step 4: Permission check
  console.log('\n📝 Step 4: Final Permission Check');
  const userData = await getUserData(userId);
  const user = userData.data;
  const permissions = user?.permissions || user?.user?.permissions || [];

  const canEdit =
    permissions.includes('admin') || permissions.includes('super_admin') || userRole === 'admin';

  console.log(`User permissions: ${JSON.stringify(permissions)}`);
  console.log(`User role: ${userRole}`);
  console.log(`Can edit: ${canEdit}`);

  console.log('\n╔════════════════════════════════════════════════════════╗');
  if (canEdit) {
    console.log('║  ✅✅✅ SHOULD BE ABLE TO EDIT ✅✅✅                   ║');
  } else {
    console.log('║  ❌❌❌ CANNOT EDIT ❌❌❌                             ║');
  }
  console.log('╚════════════════════════════════════════════════════════╝');
}

simulateFullFlow()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
