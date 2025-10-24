// Migrate the 9 new users without timestamp
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

const usersToMigrate = [
  'ftH2hO95fWh3ZuJtbzd3rc7qTwD3', // frank931023@gmail.com
  'PFFAUqLVOxaruRvNHldWyRVKb0h1', // weihong609193@gmail.com
  'lgbmVg2jwqXhRJJElWdO3YcAcB42', // adawang12101210@gmail.com
  'WsNZdHICQ2PF2OLxCeGvGi0fhBB3', // abbysuyuyan@gmail.com
  'DMwDlilwu9TXXDUvUVcrRRZYfl22', // wesley767378@gmail.com
  'M8j0UxSb0EMQkseRKcy96U3NTmV2', // 0311gino@gmail.com
  'adTSsjWUveaNSTtb8lD9YLDENTf2', // arcoshina@gmail.com
  'Wv7CCirGyRYq9zik4xX4NuzoR4v2', // sean.yuhsuan.chou@gmail.com
  'XGSoesf7m9eDftMg3bvxB2UsviI3', // yiidtw@gmail.com
];

async function migrateUsers() {
  console.log('\n=== Migrating 9 Users Without Timestamp ===\n');
  
  let migratedCount = 0;
  
  for (const userId of usersToMigrate) {
    const docRef = db.collection('registrations').doc(userId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log(`❌ User ${userId} not found`);
      continue;
    }
    
    const data = doc.data();
    
    if (data.timestamp) {
      console.log(`⏭️  User ${userId} already has timestamp, skipping`);
      continue;
    }
    
    if (!data.createdAt) {
      console.log(`❌ User ${userId} has no createdAt field`);
      continue;
    }
    
    // Convert Firestore Timestamp to milliseconds
    const timestamp = data.createdAt._seconds 
      ? data.createdAt._seconds * 1000 
      : data.createdAt;
    
    console.log(`✅ Migrating ${data.email || userId}`);
    console.log(`   createdAt: ${new Date(timestamp).toISOString()}`);
    console.log(`   timestamp: ${timestamp}`);
    
    await docRef.update({
      timestamp: timestamp
    });
    
    migratedCount++;
  }
  
  console.log(`\n✅ Migrated ${migratedCount} user(s)`);
}

migrateUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
