// Script to list whitelist emails for a campaign
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

if (!admin.apps.length) {
  let privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY || '';
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

const campaignId = process.argv[2] || 'O6Mwku1y91WU93MFVNA4';

const db = admin.firestore();
db.collection('nft-campaigns')
  .doc(campaignId)
  .get()
  .then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      console.log('Campaign:', data.name);
      console.log('\nWhitelist emails:');
      const emails = data.whitelistedEmails || [];
      emails.forEach((e, i) => console.log(i + 1 + '. ' + e));
      console.log('\nTotal:', emails.length);
    } else {
      console.log('Campaign not found');
    }
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
