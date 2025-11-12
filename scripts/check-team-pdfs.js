const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require(path.resolve(__dirname, '../serviceAccountKey.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'hackathon-rwa-nexus.firebasestorage.app',
  });
}

initializeApi();

const teamId = process.argv[2];

if (!teamId) {
  console.error('Usage: node check-team-pdfs.js <teamId>');
  process.exit(1);
}

async function checkTeamPDFs() {
  try {
    console.log(`\n🔍 Checking PDFs for team: ${teamId}\n`);

    // 1. Check Firestore
    const db = admin.firestore();
    const teamDoc = await db.collection('team-registrations').doc(teamId).get();

    if (!teamDoc.exists) {
      console.error('❌ Team not found in Firestore');
      process.exit(1);
    }

    const teamData = teamDoc.data();
    console.log('📋 Team Name:', teamData.teamName);
    console.log('📋 Submitted PDF in Firestore:');
    if (teamData.submittedPdf) {
      console.log('   File Name:', teamData.submittedPdf.fileName);
      console.log('   File URL:', teamData.submittedPdf.fileUrl);
      console.log('   Uploaded By:', teamData.submittedPdf.uploadedBy);
      console.log('   Uploaded At:', teamData.submittedPdf.uploadedAt?.toDate?.());
    } else {
      console.log('   ❌ No submitted PDF in Firestore');
    }

    // 2. Check Firebase Storage
    console.log('\n📦 Checking Firebase Storage...');
    const bucket = admin.storage().bucket();
    const prefix = `team-pdfs/${teamId}/`;

    const [files] = await bucket.getFiles({ prefix });

    if (files.length === 0) {
      console.log('   ❌ No files found in Storage');
    } else {
      console.log(`   ✅ Found ${files.length} file(s):\n`);

      for (const file of files) {
        const [metadata] = await file.getMetadata();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

        console.log(`   📄 ${file.name}`);
        console.log(`      Size: ${(metadata.size / 1024).toFixed(2)} KB`);
        console.log(`      Type: ${metadata.contentType}`);
        console.log(`      Created: ${metadata.timeCreated}`);
        console.log(`      Public URL: ${publicUrl}`);
        console.log('');
      }
    }

    // 3. Check if URLs match
    if (teamData.submittedPdf && files.length > 0) {
      const firestoreUrl = teamData.submittedPdf.fileUrl;
      const storageUrls = files.map(
        (f) => `https://storage.googleapis.com/${bucket.name}/${f.name}`,
      );

      console.log('🔗 URL Match Check:');
      if (storageUrls.includes(firestoreUrl)) {
        console.log('   ✅ Firestore URL matches Storage file');
      } else {
        console.log('   ❌ Firestore URL does NOT match any Storage file');
        console.log('   Firestore URL:', firestoreUrl);
        console.log('   Storage URLs:', storageUrls);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTeamPDFs();
