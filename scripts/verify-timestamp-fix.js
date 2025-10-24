// Verify all users now have timestamp
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
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

async function verifyFix() {
  console.log('\n=== Verifying Timestamp Fix ===\n');
  
  const registrations = await db.collection('registrations').get();
  
  let withTimestamp = 0;
  let withoutTimestamp = 0;
  const missingUsers = [];
  
  registrations.forEach(doc => {
    const data = doc.data();
    if (data.timestamp) {
      withTimestamp++;
    } else {
      withoutTimestamp++;
      missingUsers.push({
        id: doc.id,
        email: data.email || data.user?.email || data.user?.preferredEmail || 'N/A'
      });
    }
  });
  
  console.log(`Total users: ${registrations.size}`);
  console.log(`✅ With timestamp: ${withTimestamp}`);
  console.log(`❌ Without timestamp: ${withoutTimestamp}\n`);
  
  if (withoutTimestamp > 0) {
    console.log('Users still missing timestamp:');
    missingUsers.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email} (${user.id})`);
    });
  } else {
    console.log('🎉 ALL USERS HAVE TIMESTAMP! 🎉');
  }
}

verifyFix()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
