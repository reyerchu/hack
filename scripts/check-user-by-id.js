/**
 * Quick script to check user by ID
 */

require('dotenv').config({ path: '.env.local' });
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

async function checkUserById(userId) {
  try {
    console.log(`\n🔍 Checking user ID: ${userId}\n`);

    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.error(`❌ User document does not exist for ID: ${userId}\n`);
      process.exit(1);
    }

    const userData = userDoc.data();
    
    console.log('📋 User Document Found:');
    console.log('  User ID:', userDoc.id);
    console.log('  Email:', userData.email);
    console.log('  PreferredEmail:', userData.preferredEmail);
    console.log('  Permissions:', JSON.stringify(userData.permissions));
    console.log('  Has super_admin?', userData.permissions?.includes('super_admin') ? '✅ YES' : '❌ NO');
    console.log('\n📄 Full user data:');
    console.log(JSON.stringify(userData, null, 2));
    console.log('\n');

    // Update to super_admin if not already
    if (!userData.permissions?.includes('super_admin')) {
      console.log('🔧 Updating permissions to super_admin...');
      await db.collection('users').doc(userId).update({
        permissions: ['super_admin'],
      });
      console.log('✅ Updated permissions to super_admin\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

const userId = process.argv[2] || 'uzzaaoqnViVklglHDTQ1KCCbSXt2';
checkUserById(userId);

