#!/usr/bin/env node
/**
 * Find user by email
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
const searchEmail = process.argv[2] || 'reyer.chu@rwa.nexus';

async function findUserByEmail() {
  console.log(`🔍 Searching for: ${searchEmail}\n`);

  try {
    const registrationsSnapshot = await db.collection('registrations').get();

    const matches = [];

    registrationsSnapshot.forEach((doc) => {
      const data = doc.data();
      const email = data.user?.preferredEmail || data.user?.email || data.email;

      if (email && email.toLowerCase() === searchEmail.toLowerCase()) {
        matches.push({
          id: doc.id,
          email: email,
          name: data.user?.name || 'N/A',
          permissions: data.permissions || data.user?.permissions || [],
        });
      }
    });

    if (matches.length === 0) {
      console.log(`❌ No user found with email: ${searchEmail}`);
      console.log('\n💡 You need to either:');
      console.log('   1. Register this email in the system');
      console.log('   2. Or add super_admin permission to an existing user');
    } else {
      console.log(`✅ Found ${matches.length} user(s):\n`);
      matches.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Permissions: ${user.permissions.join(', ') || '(none)'}`);
        console.log('');

        if (!user.permissions.includes('super_admin')) {
          console.log(`   ⚠️  This user is NOT a super_admin`);
          console.log(`   💡 Run: node scripts/add-super-admin.js ${user.id}`);
          console.log('');
        }
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

findUserByEmail();
