#!/usr/bin/env node
/**
 * Check super_admin users in Firestore
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

  // Remove quotes if present
  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }

  // Replace escaped newlines with actual newlines
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

async function checkSuperAdmins() {
  console.log('🔍 Checking super_admin users...\n');

  try {
    const registrationsSnapshot = await db.collection('registrations').get();

    console.log(`Total registrations: ${registrationsSnapshot.size}\n`);

    const superAdmins = [];

    registrationsSnapshot.forEach((doc) => {
      const data = doc.data();
      const permissions = data.permissions || data.user?.permissions || [];

      if (permissions.includes('super_admin')) {
        const email = data.user?.preferredEmail || data.user?.email || data.email;
        superAdmins.push({
          id: doc.id,
          email: email,
          name: data.user?.name || 'N/A',
          permissions: permissions,
        });
      }
    });

    console.log(`✅ Found ${superAdmins.length} super_admin(s):\n`);

    superAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Permissions: ${admin.permissions.join(', ')}`);
      console.log('');
    });

    // Check for reyer.chu@rwa.nexus
    const reyerAdmin = superAdmins.find((a) => a.email === 'reyer.chu@rwa.nexus');

    if (reyerAdmin) {
      console.log('✅ reyer.chu@rwa.nexus IS in super_admin list');
    } else {
      console.log('❌ reyer.chu@rwa.nexus NOT in super_admin list');
      console.log('\n💡 Super admin emails found:');
      superAdmins.forEach((a) => console.log(`   - ${a.email}`));
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

checkSuperAdmins();
