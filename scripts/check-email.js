/**
 * Script to diagnose email registration in database
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Manual .env file loading
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      value = value.replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const projectId = process.env.SERVICE_ACCOUNT_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.SERVICE_ACCOUNT_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Missing Firebase credentials in environment variables');
  console.error(
    'Required: SERVICE_ACCOUNT_PROJECT_ID, SERVICE_ACCOUNT_CLIENT_EMAIL, SERVICE_ACCOUNT_PRIVATE_KEY',
  );
  process.exit(1);
}

// Process private key
privateKey = privateKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey,
    }),
  });
}

const db = admin.firestore();

async function checkEmail(email) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔍 檢查郵箱: ${email}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const normalizedEmail = email.trim().toLowerCase();
  console.log(`📧 標準化郵箱: ${normalizedEmail}\n`);

  // Check registrations collection
  console.log('📂 檢查 registrations collection...');
  console.log('   查詢條件: user.preferredEmail == ' + normalizedEmail);

  const regSnapshot = await db
    .collection('registrations')
    .where('user.preferredEmail', '==', normalizedEmail)
    .limit(1)
    .get();

  if (!regSnapshot.empty) {
    console.log('   ✅ 找到記錄！');
    const doc = regSnapshot.docs[0];
    const data = doc.data();
    console.log('   文檔 ID:', doc.id);
    console.log('   user.preferredEmail:', data.user?.preferredEmail);
    console.log('   user.firstName:', data.user?.firstName);
    console.log('   user.lastName:', data.user?.lastName);
    console.log('   user.nickname:', data.user?.nickname);
    return;
  } else {
    console.log('   ❌ 未找到記錄\n');
  }

  // Check users collection
  console.log('📂 檢查 users collection...');
  console.log('   查詢條件: preferredEmail == ' + normalizedEmail);

  const usersSnapshot = await db
    .collection('users')
    .where('preferredEmail', '==', normalizedEmail)
    .limit(1)
    .get();

  if (!usersSnapshot.empty) {
    console.log('   ✅ 找到記錄！');
    const doc = usersSnapshot.docs[0];
    const data = doc.data();
    console.log('   文檔 ID:', doc.id);
    console.log('   preferredEmail:', data.preferredEmail);
    console.log('   firstName:', data.firstName);
    console.log('   lastName:', data.lastName);
    console.log('   nickname:', data.nickname);
    return;
  } else {
    console.log('   ❌ 未找到記錄\n');
  }

  // Search in registrations with other email fields
  console.log('📂 搜索 registrations 中的其他郵箱字段...');
  const allRegs = await db.collection('registrations').limit(100).get();

  let found = false;
  allRegs.docs.forEach((doc) => {
    const data = doc.data();
    const emails = [];

    // Collect all possible email fields
    if (data.user?.preferredEmail)
      emails.push({ field: 'user.preferredEmail', value: data.user.preferredEmail });
    if (data.user?.email) emails.push({ field: 'user.email', value: data.user.email });
    if (data.email) emails.push({ field: 'email', value: data.email });
    if (data.user?.user?.email)
      emails.push({ field: 'user.user.email', value: data.user.user.email });
    if (data.user?.user?.preferredEmail)
      emails.push({ field: 'user.user.preferredEmail', value: data.user.user.preferredEmail });

    // Check if any email matches
    emails.forEach(({ field, value }) => {
      if (value && value.toLowerCase() === normalizedEmail) {
        if (!found) {
          console.log('   ✅ 找到匹配！');
          found = true;
        }
        console.log(`   文檔 ID: ${doc.id}`);
        console.log(`   字段: ${field}`);
        console.log(`   值: ${value}`);
        console.log(`   user.firstName: ${data.user?.firstName || 'N/A'}`);
        console.log(`   user.lastName: ${data.user?.lastName || 'N/A'}`);
        console.log('   ---');
      }
    });
  });

  if (!found) {
    console.log('   ❌ 在所有郵箱字段中都未找到此郵箱\n');

    // Show sample of what's in the database
    console.log('📋 數據庫中的郵箱樣本（前10個）:');
    let count = 0;
    allRegs.docs.forEach((doc) => {
      if (count >= 10) return;
      const data = doc.data();
      const email = data.user?.preferredEmail || data.user?.email || data.email || 'N/A';
      console.log(`   ${count + 1}. ${email}`);
      count++;
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Get email from command line argument
const emailToCheck = process.argv[2] || 'reyerchu@yahoo.com.tw';

checkEmail(emailToCheck)
  .then(() => {
    console.log('\n✅ 檢查完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 錯誤:', error);
    process.exit(1);
  });
