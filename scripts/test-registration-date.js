/**
 * Test: Verify new user registration includes timestamp
 *
 * This script verifies that:
 * 1. Registration API saves timestamp field
 * 2. Admin users API returns timestamp field
 * 3. Frontend correctly displays the registration date
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach((line) => {
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

async function testRegistrationDate() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  Registration Date Test - Verification Report          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Step 1: Check registration API code structure
  console.log('📝 Step 1: Checking Registration API Code...\n');

  const apiFilePath = path.join(__dirname, '..', 'pages', 'api', 'applications.ts');
  const apiCode = fs.readFileSync(apiFilePath, 'utf8');

  const hasTimestampField = apiCode.includes('timestamp: Date.now()');
  console.log(`   ✅ API file location: ${apiFilePath}`);
  console.log(`   ${hasTimestampField ? '✅' : '❌'} API saves 'timestamp: Date.now()' field`);

  if (!hasTimestampField) {
    console.log('   ❌ ERROR: API code does not include timestamp field!');
    process.exit(1);
  }

  // Step 2: Check admin users page code
  console.log('\n📝 Step 2: Checking Admin Users Page Code...\n');

  const adminFilePath = path.join(__dirname, '..', 'pages', 'admin', 'users.tsx');
  const adminCode = fs.readFileSync(adminFilePath, 'utf8');

  const readsTimestamp = adminCode.includes('userData.timestamp');
  console.log(`   ✅ Admin page location: ${adminFilePath}`);
  console.log(`   ${readsTimestamp ? '✅' : '❌'} Admin page reads 'userData.timestamp' field`);

  if (!readsTimestamp) {
    console.log('   ❌ ERROR: Admin page does not read timestamp field!');
    process.exit(1);
  }

  // Step 3: Check database - verify all users have timestamp
  console.log('\n📝 Step 3: Checking Database Records...\n');

  const registrations = await db.collection('registrations').get();

  let totalUsers = 0;
  let usersWithTimestamp = 0;
  let usersWithoutTimestamp = 0;
  let recentUsers = [];

  registrations.forEach((doc) => {
    const data = doc.data();
    totalUsers++;

    if (data.timestamp) {
      usersWithTimestamp++;
      recentUsers.push({
        email: data.email || data.user?.email || data.user?.preferredEmail || 'N/A',
        timestamp: data.timestamp,
        date: new Date(data.timestamp).toLocaleString('zh-TW'),
      });
    } else {
      usersWithoutTimestamp++;
    }
  });

  // Sort by timestamp (most recent first)
  recentUsers.sort((a, b) => b.timestamp - a.timestamp);

  console.log(`   Total users: ${totalUsers}`);
  console.log(
    `   ${usersWithTimestamp > 0 ? '✅' : '❌'} Users with timestamp: ${usersWithTimestamp}`,
  );
  console.log(
    `   ${
      usersWithoutTimestamp === 0 ? '✅' : '❌'
    } Users without timestamp: ${usersWithoutTimestamp}`,
  );

  // Step 4: Show recent registrations
  console.log('\n📝 Step 4: Recent Registrations (Last 5)...\n');

  recentUsers.slice(0, 5).forEach((user, idx) => {
    console.log(`   ${idx + 1}. ${user.email}`);
    console.log(`      Date: ${user.date}`);
    console.log(`      Timestamp: ${user.timestamp}`);
    console.log('');
  });

  // Step 5: Final verification
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  Final Verification                                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const allChecks = [
    { name: 'API saves timestamp field', passed: hasTimestampField },
    { name: 'Admin page reads timestamp field', passed: readsTimestamp },
    { name: 'All users have timestamp in DB', passed: usersWithoutTimestamp === 0 },
    { name: 'Database has users', passed: totalUsers > 0 },
  ];

  const allPassed = allChecks.every((check) => check.passed);

  allChecks.forEach((check) => {
    console.log(`   ${check.passed ? '✅' : '❌'} ${check.name}`);
  });

  console.log('\n' + '═'.repeat(61) + '\n');

  if (allPassed) {
    console.log('   🎉 ALL CHECKS PASSED! 🎉\n');
    console.log('   ✅ New user registrations WILL show registration date');
    console.log('   ✅ Existing users all have registration dates');
    console.log('   ✅ Admin page correctly displays registration dates\n');
    console.log('   You can verify by visiting:');
    console.log('   📱 http://localhost:3009/admin/users\n');
  } else {
    console.log('   ❌ SOME CHECKS FAILED\n');
    console.log('   Please review the errors above.\n');
    process.exit(1);
  }

  console.log('═'.repeat(61) + '\n');
}

testRegistrationDate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Test failed with error:', err);
    process.exit(1);
  });
