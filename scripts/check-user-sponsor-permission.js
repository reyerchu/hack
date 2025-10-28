const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  let privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!privateKey) {
    console.error('SERVICE_ACCOUNT_PRIVATE_KEY not set. Please run: source .env.local');
    process.exit(1);
  }
  if (privateKey.startsWith('"') || privateKey.startsWith("'")) {
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

async function checkUserPermission(email) {
  console.log(`\n=== Checking permissions for: ${email} ===\n`);

  // 1. Find user by email in registrations
  const registrationsSnapshot = await db
    .collection('registrations')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (registrationsSnapshot.empty) {
    console.log('❌ User not found in registrations collection');
    return;
  }

  const userDoc = registrationsSnapshot.docs[0];
  const userData = userDoc.data();
  const userId = userDoc.id;

  console.log(`✅ User found:`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Email: ${userData.email || userData.preferredEmail}`);
  console.log(`   Name: ${userData.user?.firstName} ${userData.user?.lastName}`);
  console.log(`   Permissions: ${JSON.stringify(userData.user?.permissions || [])}`);

  // 2. Check sponsor-user-mappings
  console.log(`\n--- Sponsor User Mappings ---`);
  const mappingsSnapshot = await db
    .collection('sponsor-user-mappings')
    .where('userId', '==', userId)
    .get();

  if (mappingsSnapshot.empty) {
    console.log('❌ No sponsor mappings found for this user');
  } else {
    console.log(`✅ Found ${mappingsSnapshot.size} sponsor mapping(s):`);
    for (const doc of mappingsSnapshot.docs) {
      const mapping = doc.data();
      console.log(`\n   Mapping ID: ${doc.id}`);
      console.log(`   Sponsor ID: ${mapping.sponsorId}`);
      console.log(`   Role: ${mapping.role}`);
      console.log(`   Can Edit: ${mapping.canEdit || false}`);

      // Get sponsor name
      const sponsorDoc = await db.collection('extended-sponsors').doc(mapping.sponsorId).get();
      if (sponsorDoc.exists) {
        const sponsor = sponsorDoc.data();
        console.log(`   Sponsor Name: ${sponsor.name}`);
      }
    }
  }

  // 3. Check challenge access for imtoken
  console.log(`\n--- Checking imToken Challenge Access ---`);

  // Find imtoken sponsor
  const imtokenSnapshot = await db
    .collection('extended-sponsors')
    .where('name', '==', 'imToken')
    .limit(1)
    .get();

  if (imtokenSnapshot.empty) {
    console.log('❌ imToken sponsor not found');
  } else {
    const imtokenDoc = imtokenSnapshot.docs[0];
    const imtoken = imtokenDoc.data();
    console.log(`✅ imToken Sponsor ID: ${imtokenDoc.id}`);
    console.log(`   Managers: ${JSON.stringify(imtoken.managers || [])}`);

    // Check if user is in managers
    const isManager = imtoken.managers?.includes(email) || imtoken.managers?.includes(userId);
    console.log(`   User is manager: ${isManager}`);

    // Check mapping for imtoken
    const imtokenMapping = await db
      .collection('sponsor-user-mappings')
      .where('userId', '==', userId)
      .where('sponsorId', '==', imtokenDoc.id)
      .limit(1)
      .get();

    if (!imtokenMapping.empty) {
      const mapping = imtokenMapping.docs[0].data();
      console.log(`\n   ✅ Has mapping for imToken:`);
      console.log(`      Role: ${mapping.role}`);
      console.log(`      Can Edit: ${mapping.canEdit || false}`);
    } else {
      console.log(`\n   ❌ No mapping found for imToken`);
    }
  }

  // 4. Check the specific challenge
  console.log(`\n--- Checking Challenge 2I3wWp7VG9YRmYY2yeOH ---`);
  const challengeDoc = await db.collection('extended-challenges').doc('2I3wWp7VG9YRmYY2yeOH').get();

  if (!challengeDoc.exists) {
    console.log('❌ Challenge not found');
  } else {
    const challenge = challengeDoc.data();
    console.log(`✅ Challenge found:`);
    console.log(`   Title: ${challenge.title}`);
    console.log(`   Sponsor ID: ${challenge.sponsorId}`);
    console.log(`   Track ID: ${challenge.trackId}`);
    console.log(`   Status: ${challenge.status}`);
  }

  console.log('\n=== End of Check ===\n');
}

checkUserPermission('alphareyer@gmail.com')
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
