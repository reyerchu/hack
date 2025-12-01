const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

if (!admin.apps.length) {
  try {
    if (
      process.env.SERVICE_ACCOUNT_PROJECT_ID &&
      process.env.SERVICE_ACCOUNT_CLIENT_EMAIL &&
      process.env.SERVICE_ACCOUNT_PRIVATE_KEY
    ) {
      let privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY;
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
      console.log('✅ Firebase initialized.');
    } else {
      admin.initializeApp();
    }
  } catch (error) {
    console.error('Init failed', error);
  }
}

const db = admin.firestore();
const CAMPAIGN_IDS = ['PZBQocgi3r8s1tkSk1pN', 'kkzoflBOsBxR3swP7F2M'];

async function checkImages() {
  for (const id of CAMPAIGN_IDS) {
    console.log(`Checking campaign: ${id}`);
    const doc = await db.collection('nft-campaigns').doc(id).get();
    if (!doc.exists) {
      console.log('❌ Campaign not found');
      continue;
    }
    const data = doc.data();
    console.log(`   Name: ${data.name}`);
    console.log(`   Image URL: ${data.imageUrl}`);
  }
}

checkImages();
