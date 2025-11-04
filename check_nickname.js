const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'hackathon-rwa-nexus.firebasestorage.app',
  });
}

const db = admin.firestore();

async function checkUser() {
  try {
    const email = 'tj10051020@icloud.com';

    const authUser = await admin.auth().getUserByEmail(email);
    console.log('Auth UID:', authUser.uid);
    console.log('Auth displayName:', authUser.displayName);

    const regDoc = await db.collection('registrations').doc(authUser.uid).get();
    if (regDoc.exists) {
      const data = regDoc.data();
      console.log('\n=== Registration Data ===');
      console.log('nickname:', data.nickname);
      console.log('displayName:', data.displayName);
      console.log('firstName:', data.firstName);
      console.log('lastName:', data.lastName);
      console.log(
        '\nAll fields:',
        Object.keys(data)
          .filter((k) => !k.startsWith('_'))
          .sort(),
      );
    } else {
      console.log('Registration not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUser();
