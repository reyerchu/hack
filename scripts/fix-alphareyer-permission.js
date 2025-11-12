// Simple script to check and fix alphareyer@gmail.com permissions
// Run with: node -r dotenv/config scripts/fix-alphareyer-permission.js

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

async function checkAndFix() {
  const email = 'alphareyer@gmail.com';
  console.log(`\nChecking ${email}...`);

  // 1. Find user
  let usersSnapshot = await db
    .collection('registrations')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (usersSnapshot.empty) {
    console.log('Not found by email, trying preferredEmail...');
    usersSnapshot = await db
      .collection('registrations')
      .where('preferredEmail', '==', email)
      .limit(1)
      .get();
  }

  if (usersSnapshot.empty) {
    console.log('Not found by preferredEmail, trying user.preferredEmail...');
    usersSnapshot = await db
      .collection('registrations')
      .where('user.preferredEmail', '==', email)
      .limit(1)
      .get();
  }

  if (usersSnapshot.empty) {
    console.log('User not found in registrations');

    // Try to list all users to see the structure
    console.log('\nListing first 3 users for debugging:');
    const allUsers = await db.collection('registrations').limit(3).get();
    allUsers.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ID: ${doc.id}`);
      console.log(`    email: ${data.email}`);
      console.log(`    preferredEmail: ${data.preferredEmail}`);
      console.log(`    user.email: ${data.user?.email}`);
      console.log(`    user.preferredEmail: ${data.user?.preferredEmail}`);
    });

    return;
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();

  console.log(`User ID: ${userId}`);
  console.log(`Permissions: ${JSON.stringify(userData.user?.permissions)}`);

  // 2. Find imToken sponsor
  const imtokenSnapshot = await db
    .collection('extended-sponsors')
    .where('name', '==', 'imToken')
    .limit(1)
    .get();

  if (imtokenSnapshot.empty) {
    console.log('imToken sponsor not found');
    return;
  }

  const imtokenDoc = imtokenSnapshot.docs[0];
  const imtokenId = imtokenDoc.id;
  const imtoken = imtokenDoc.data();

  console.log(`\nimToken Sponsor ID: ${imtokenId}`);
  console.log(`Managers: ${JSON.stringify(imtoken.managers)}`);

  // 3. Check sponsor-user-mapping
  const mappingSnapshot = await db
    .collection('sponsor-user-mappings')
    .where('userId', '==', userId)
    .where('sponsorId', '==', imtokenId)
    .limit(1)
    .get();

  if (mappingSnapshot.empty) {
    console.log('\n❌ No mapping found! Creating one...');

    await db.collection('sponsor-user-mappings').add({
      userId: userId,
      sponsorId: imtokenId,
      role: 'admin',
      canEdit: true,
      createdAt: admin.firestore.Timestamp.now(),
    });

    console.log('✅ Mapping created!');
  } else {
    const mapping = mappingSnapshot.docs[0].data();
    console.log(`\n✅ Mapping exists:`);
    console.log(`   Role: ${mapping.role}`);
    console.log(`   Can Edit: ${mapping.canEdit}`);

    if (mapping.role !== 'admin' || mapping.canEdit !== true) {
      console.log('\n⚠️  Fixing mapping (setting role=admin, canEdit=true)...');
      await mappingSnapshot.docs[0].ref.update({
        role: 'admin',
        canEdit: true,
        updatedAt: admin.firestore.Timestamp.now(),
      });
      console.log('✅ Fixed!');
    } else {
      console.log('\n✅ Mapping is correct!');
    }
  }

  console.log('\n✅ Done!');
}

checkAndFix()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
