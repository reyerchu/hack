const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkDeleteRequests() {
  try {
    const snapshot = await db
      .collection('team-delete-requests')
      .orderBy('requestedAt', 'desc')
      .limit(5)
      .get();

    console.log(`\nFound ${snapshot.size} delete requests:\n`);

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`Team: ${data.teamName} (${data.teamId})`);
      console.log(`Requested by: ${data.requestedBy?.email} (${data.requestedBy?.role})`);
      console.log(`Status: ${data.status}`);
      console.log(`Time: ${data.requestedAt?.toDate()}`);
      console.log('---');
    });

    if (snapshot.empty) {
      console.log('❌ No delete requests found in Firestore.');
      console.log('\nThis means either:');
      console.log('1. No one has sent a delete request yet');
      console.log('2. The delete request code is not being triggered');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDeleteRequests();
