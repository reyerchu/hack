const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: process.env.SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();
const email = 'alphareyer@gmail.com';

async function checkUser() {
  try {
    const snapshot = await db.collection('registrations').where('email', '==', email).get();
    
    if (snapshot.empty) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    const user = snapshot.docs[0].data();
    console.log('✅ User found');
    console.log('Permissions:', user.permissions || ['user']);
    console.log('User ID:', snapshot.docs[0].id);
    
    // Check sponsor-user-mappings
    const mappingsSnapshot = await db.collection('sponsor-user-mappings')
      .where('userId', '==', snapshot.docs[0].id)
      .get();
    
    if (mappingsSnapshot.empty) {
      console.log('❌ No sponsor-user-mappings found');
    } else {
      console.log('✅ Sponsor mappings found:', mappingsSnapshot.size);
      mappingsSnapshot.docs.forEach(doc => {
        const mapping = doc.data();
        console.log(' - Sponsor ID:', mapping.sponsorId);
        console.log('   Track IDs:', mapping.trackIds || []);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUser();

