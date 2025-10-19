/**
 * Script to set sponsor permission for a user
 * 
 * Usage:
 *   node scripts/set-sponsor-permission.js <email>
 *   node scripts/set-sponsor-permission.js alphareyer@gmail.com
 */

const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function setSponsorPermission(email) {
  try {
    console.log(`\n🔍 Searching for user: ${email}...`);

    // 1. Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      console.error(`\n❌ Error: User not found with email: ${email}`);
      console.log(`\nℹ️  Please make sure:`);
      console.log(`   1. The user has registered on the platform`);
      console.log(`   2. The email is correct`);
      console.log(`   3. The user document exists in Firestore 'users' collection\n`);
      return false;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log(`\n✅ Found user:`);
    console.log(`   Email: ${email}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Name: ${userData.firstName || ''} ${userData.lastName || ''}`);

    // 2. Check current permissions
    const currentPermissions = userData.permissions || ['user'];
    console.log(`\n📋 Current permissions: [${currentPermissions.join(', ')}]`);

    if (currentPermissions.includes('sponsor')) {
      console.log(`\nℹ️  User already has 'sponsor' permission!`);
      console.log(`   No changes needed.\n`);
      return true;
    }

    // 3. Update permissions
    const updatedPermissions = [...currentPermissions, 'sponsor'];

    await db.collection('users').doc(userId).update({
      permissions: updatedPermissions,
    });

    console.log(`\n✅ Successfully updated permissions!`);
    console.log(`   Old permissions: [${currentPermissions.join(', ')}]`);
    console.log(`   New permissions: [${updatedPermissions.join(', ')}]`);

    console.log(`\n📝 Next steps:`);
    console.log(`   1. User should log out and log back in`);
    console.log(`   2. User will see "賛助商" link in navigation`);
    console.log(`   3. User can access: https://hackathon.com.tw/sponsor/dashboard`);
    console.log(`   4. Assign tracks to this sponsor in extended-sponsors collection\n`);

    return true;

  } catch (error) {
    console.error(`\n❌ Error updating permissions:`, error);
    console.log(`\n💡 Possible causes:`);
    console.log(`   1. Database connection issue`);
    console.log(`   2. Invalid Firebase credentials`);
    console.log(`   3. Insufficient permissions to update users\n`);
    return false;
  }
}

// Main execution
async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Set Sponsor Permission Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage:
  node scripts/set-sponsor-permission.js <email>

Example:
  node scripts/set-sponsor-permission.js alphareyer@gmail.com

Description:
  This script adds 'sponsor' permission to a user account,
  allowing them to access the Sponsor Dashboard and manage tracks.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    process.exit(1);
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Set Sponsor Permission
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  const success = await setSponsorPermission(email);

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  process.exit(success ? 0 : 1);
}

main();

