#!/usr/bin/env node
/**
 * Add super_admin permission to a user
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
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

// Initialize Firebase Admin using environment variables
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
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Usage: node add-super-admin.js <userId>');
  console.error('   Example: node add-super-admin.js eDLheGNJ64Muh6eQYVPh53Xpb3g1');
  process.exit(1);
}

async function addSuperAdmin() {
  console.log(`🔧 Adding super_admin permission to user: ${userId}\n`);

  try {
    const userRef = db.collection('registrations').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error(`❌ User not found: ${userId}`);
      process.exit(1);
    }

    const userData = userDoc.data();
    const currentPermissions = userData.permissions || userData.user?.permissions || [];
    const email = userData.user?.preferredEmail || userData.user?.email || userData.email;

    console.log(`Current user info:`);
    console.log(`  Email: ${email}`);
    console.log(`  Current permissions: ${currentPermissions.join(', ') || '(none)'}`);
    console.log('');

    if (currentPermissions.includes('super_admin')) {
      console.log('✅ User already has super_admin permission!');
      process.exit(0);
    }

    // Add super_admin to permissions
    const newPermissions = [...currentPermissions, 'super_admin'];

    await userRef.update({
      permissions: newPermissions,
    });

    console.log('✅ Successfully added super_admin permission!');
    console.log(`  New permissions: ${newPermissions.join(', ')}`);
    console.log('');
    console.log('🎉 User will now receive PDF upload notification emails!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

addSuperAdmin();
