const admin = require('firebase-admin');
const fs = require('fs');

// Load .env file manually
const envPath = '.env';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function findEmail(email) {
  console.log(`\n🔍 搜索 Email: ${email}\n`);
  const normalizedEmail = email.trim().toLowerCase();
  
  // 1. Search registrations collection
  console.log('📋 检查 registrations 集合:');
  const registrationsSnapshot = await db.collection('registrations').get();
  let foundInRegistrations = false;
  
  registrationsSnapshot.forEach(doc => {
    const data = doc.data();
    const emails = [
      data.email,
      data.user?.email,
      data.user?.preferredEmail,
    ].filter(Boolean).map(e => e.toLowerCase());
    
    if (emails.includes(normalizedEmail)) {
      foundInRegistrations = true;
      console.log(`  ✅ 找到！Document ID: ${doc.id}`);
      console.log('  数据结构:', JSON.stringify({
        email: data.email,
        'user.email': data.user?.email,
        'user.preferredEmail': data.user?.preferredEmail,
        'user.firstName': data.user?.firstName,
        'user.lastName': data.user?.lastName,
        'user.nickname': data.user?.nickname,
      }, null, 2));
    }
  });
  
  if (!foundInRegistrations) {
    console.log('  ❌ 未找到');
  }
  
  // 2. Search users collection
  console.log('\n📋 检查 users 集合:');
  const usersSnapshot = await db.collection('users').get();
  let foundInUsers = false;
  
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    const emails = [
      data.email,
      data.preferredEmail,
    ].filter(Boolean).map(e => e.toLowerCase());
    
    if (emails.includes(normalizedEmail)) {
      foundInUsers = true;
      console.log(`  ✅ 找到！Document ID: ${doc.id}`);
      console.log('  数据结构:', JSON.stringify({
        email: data.email,
        preferredEmail: data.preferredEmail,
        firstName: data.firstName,
        lastName: data.lastName,
        nickname: data.nickname,
      }, null, 2));
    }
  });
  
  if (!foundInUsers) {
    console.log('  ❌ 未找到');
  }
  
  console.log('\n✅ 搜索完成\n');
}

findEmail('reyerchu@yahoo.com.tw')
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ 错误:', err);
    process.exit(1);
  });
