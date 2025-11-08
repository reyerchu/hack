/**
 * Quick script to check user permissions in Firestore
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

async function checkUserPermissions(email) {
  try {
    console.log(`\n🔍 Checking permissions for: ${email}\n`);

    // Try multiple email fields
    let snapshot = await db.collection('users').where('preferredEmail', '==', email).get();
    
    if (snapshot.empty) {
      console.log('Not found by preferredEmail, trying email...');
      snapshot = await db.collection('users').where('email', '==', email).get();
    }
    
    if (snapshot.empty) {
      console.log('Not found by email, trying to list all users with "reyer"...');
      const allUsers = await db.collection('users').get();
      const matchingUsers = [];
      allUsers.forEach(doc => {
        const data = doc.data();
        const emailStr = JSON.stringify([data.email, data.preferredEmail]).toLowerCase();
        if (emailStr.includes('reyer')) {
          matchingUsers.push({
            id: doc.id,
            email: data.email,
            preferredEmail: data.preferredEmail,
            permissions: data.permissions,
          });
        }
      });
      
      if (matchingUsers.length > 0) {
        console.log('\n📋 Found matching users:');
        matchingUsers.forEach(u => {
          console.log(`  - ID: ${u.id}`);
          console.log(`    Email: ${u.email}`);
          console.log(`    PreferredEmail: ${u.preferredEmail}`);
          console.log(`    Permissions: ${JSON.stringify(u.permissions)}`);
          console.log('');
        });
        process.exit(0);
      }
      
      console.error(`❌ User not found with email: ${email}\n`);
      process.exit(1);
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('📋 User Document:');
    console.log('  User ID:', userDoc.id);
    console.log('  Email:', userData.email || userData.preferredEmail);
    console.log('  Permissions:', JSON.stringify(userData.permissions));
    console.log('  Has super_admin?', userData.permissions?.includes('super_admin') ? '✅ YES' : '❌ NO');
    console.log('\n📄 Full user data:');
    console.log(JSON.stringify(userData, null, 2));
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

const email = process.argv[2] || 'reyerchu@defintek.io';
checkUserPermissions(email);

