// Test full permission check flow for alphareyer@gmail.com
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

async function testFullCheck() {
  const email = 'alphareyer@gmail.com';
  const challengeId = '2I3wWp7VG9YRmYY2yeOH';

  console.log('=== Testing Full Permission Check ===\n');

  // 1. Find user
  console.log('Step 1: Finding user...');
  let userQuery = await db
    .collection('registrations')
    .where('user.preferredEmail', '==', email)
    .limit(1)
    .get();

  if (userQuery.empty) {
    console.log('User not found!');
    return;
  }

  const userDoc = userQuery.docs[0];
  const userId = userDoc.id; // This is the document ID
  const userData = userDoc.data();

  console.log(`✅ User found:`);
  console.log(`   Document ID (userId): ${userId}`);
  console.log(`   Email: ${userData.user?.preferredEmail}`);
  console.log(`   Permissions: ${JSON.stringify(userData.user?.permissions)}\n`);

  // 2. Get challenge
  console.log('Step 2: Getting challenge...');
  const challengeDoc = await db.collection('extended-challenges').doc(challengeId).get();

  if (!challengeDoc.exists) {
    console.log('Challenge not found!');
    return;
  }

  const challenge = challengeDoc.data();
  console.log(`✅ Challenge found:`);
  console.log(`   Title: ${challenge.title}`);
  console.log(`   Sponsor ID: ${challenge.sponsorId}\n`);

  // 3. Check sponsor-user-mapping
  console.log('Step 3: Checking sponsor-user-mapping...');
  console.log(`   Querying: userId='${userId}' AND sponsorId='${challenge.sponsorId}'`);

  const mappingQuery = await db
    .collection('sponsor-user-mappings')
    .where('userId', '==', userId)
    .where('sponsorId', '==', challenge.sponsorId)
    .get();

  console.log(`   Query returned ${mappingQuery.size} document(s)\n`);

  if (mappingQuery.empty) {
    console.log('❌ NO MAPPING FOUND!');
    console.log('\nLet me check all mappings for this user:');

    const allMappings = await db
      .collection('sponsor-user-mappings')
      .where('userId', '==', userId)
      .get();

    console.log(`   Found ${allMappings.size} total mapping(s) for this user:`);
    allMappings.docs.forEach((doc, idx) => {
      const m = doc.data();
      console.log(
        `   ${idx + 1}. Sponsor ID: ${m.sponsorId}, Role: ${m.role}, CanEdit: ${m.canEdit}`,
      );
    });

    console.log('\nLet me check mappings for this sponsor:');
    const sponsorMappings = await db
      .collection('sponsor-user-mappings')
      .where('sponsorId', '==', challenge.sponsorId)
      .get();

    console.log(`   Found ${sponsorMappings.size} mapping(s) for sponsor ${challenge.sponsorId}:`);
    sponsorMappings.docs.forEach((doc, idx) => {
      const m = doc.data();
      console.log(`   ${idx + 1}. User ID: ${m.userId}, Role: ${m.role}, CanEdit: ${m.canEdit}`);
    });
  } else {
    const mapping = mappingQuery.docs[0].data();
    console.log(`✅ Mapping found:`);
    console.log(`   Document ID: ${mappingQuery.docs[0].id}`);
    console.log(`   Role: ${mapping.role}`);
    console.log(`   CanEdit: ${mapping.canEdit}`);
    console.log(`   Created: ${mapping.createdAt}`);
    console.log(`   Updated: ${mapping.updatedAt || 'N/A'}\n`);

    // 4. Simulate permission check
    console.log('Step 4: Simulating permission check...');
    const userPermissions = userData.user?.permissions || [];
    const userRole = mapping.role;

    const canEdit =
      userPermissions.includes('admin') ||
      userPermissions.includes('super_admin') ||
      userRole === 'admin';

    console.log(`   User permissions: ${JSON.stringify(userPermissions)}`);
    console.log(`   User role in sponsor: ${userRole}`);
    console.log(`   ✅ Can Edit: ${canEdit}\n`);

    if (canEdit) {
      console.log('✅✅✅ USER SHOULD BE ABLE TO EDIT! ✅✅✅');
    } else {
      console.log('❌❌❌ USER CANNOT EDIT ❌❌❌');
    }
  }
}

testFullCheck()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
