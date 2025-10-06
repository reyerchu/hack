/**
 * Script to set a user as super_admin
 * Usage: node scripts/set-super-admin.js <email>
 * Example: node scripts/set-super-admin.js reyerchu@defintek.io
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: process.env.SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function setSuperAdmin(email) {
  try {
    console.log(`Looking for user with email: ${email}`);

    // Query users collection for the email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('preferredEmail', '==', email).get();

    if (snapshot.empty) {
      console.error(`❌ User with email ${email} not found`);
      console.log('Please make sure the user has registered first');
      process.exit(1);
    }

    // Update the first matching user
    const userDoc = snapshot.docs[0];
    const userId = userDoc.id;

    console.log(`Found user: ${userId}`);
    console.log('Current data:', userDoc.data());

    // Update permissions
    await usersRef.doc(userId).update({
      permissions: ['super_admin'],
    });

    console.log(`✅ Successfully set ${email} as super_admin`);

    // Verify the update
    const updatedDoc = await usersRef.doc(userId).get();
    console.log('Updated data:', updatedDoc.data());

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/set-super-admin.js <email>');
  process.exit(1);
}

setSuperAdmin(email);
