// Check structure of recent registrations
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

async function checkRecentUsers() {
  console.log('\n=== Checking Recent Registrations ===\n');
  
  const registrations = await db.collection('registrations').get();
  
  console.log(`Total registrations: ${registrations.size}\n`);
  
  // Get all users and sort by any available timestamp
  const users = [];
  registrations.forEach(doc => {
    const data = doc.data();
    let timestamp = null;
    let timestampSource = 'NONE';
    
    if (data.timestamp) {
      timestamp = data.timestamp;
      timestampSource = 'timestamp';
    } else if (data.createdAt) {
      timestamp = data.createdAt._seconds ? data.createdAt._seconds * 1000 : data.createdAt;
      timestampSource = 'createdAt';
    } else if (data.user?.timestamp) {
      timestamp = data.user.timestamp;
      timestampSource = 'user.timestamp';
    } else if (data.user?.createdAt) {
      timestamp = data.user.createdAt._seconds ? data.user.createdAt._seconds * 1000 : data.user.createdAt;
      timestampSource = 'user.createdAt';
    }
    
    users.push({
      id: doc.id,
      email: data.email || data.user?.email || data.user?.preferredEmail || 'N/A',
      name: data.name || data.user?.name || 'N/A',
      timestamp,
      timestampSource,
      hasTimestamp: !!data.timestamp,
      hasCreatedAt: !!data.createdAt,
      hasUserTimestamp: !!data.user?.timestamp,
      hasUserCreatedAt: !!data.user?.createdAt,
      rawData: {
        topLevel: Object.keys(data),
        userLevel: data.user ? Object.keys(data.user) : []
      }
    });
  });
  
  // Sort by timestamp (most recent first)
  users.sort((a, b) => {
    if (!a.timestamp && !b.timestamp) return 0;
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return b.timestamp - a.timestamp;
  });
  
  // Show last 10 users
  console.log('=== Last 10 Registered Users ===\n');
  users.slice(0, 10).forEach((user, idx) => {
    console.log(`${idx + 1}. ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Timestamp: ${user.timestamp ? new Date(user.timestamp).toISOString() : 'MISSING'}`);
    console.log(`   Source: ${user.timestampSource}`);
    console.log(`   Data structure:`);
    console.log(`   - timestamp field: ${user.hasTimestamp ? '✅' : '❌'}`);
    console.log(`   - createdAt field: ${user.hasCreatedAt ? '✅' : '❌'}`);
    console.log(`   - user.timestamp: ${user.hasUserTimestamp ? '✅' : '❌'}`);
    console.log(`   - user.createdAt: ${user.hasUserCreatedAt ? '✅' : '❌'}`);
    console.log(`   Top-level keys: ${user.rawData.topLevel.join(', ')}`);
    console.log(`   User-level keys: ${user.rawData.userLevel.join(', ')}`);
    console.log('');
  });
  
  // Count users without timestamp
  const usersWithoutTimestamp = users.filter(u => !u.timestamp);
  console.log(`\n⚠️  Users without any timestamp: ${usersWithoutTimestamp.length}`);
  
  if (usersWithoutTimestamp.length > 0) {
    console.log('\nUsers without timestamp:');
    usersWithoutTimestamp.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email} (${user.id})`);
    });
  }
}

checkRecentUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
