const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const https = require('https');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require(path.resolve(__dirname, '../lib/serviceAccountKey.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'hackathon-rwa-nexus.firebasestorage.app',
  });
}

const OUTPUT_DIR = path.resolve(__dirname, '../public/team-media/2025/DemoDay');

async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
  });
}

async function syncTeamPDFs() {
  try {
    console.log('\n🔄 Syncing team PDFs from Firebase Storage to local directory...\n');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log('✅ Created directory:', OUTPUT_DIR);
    }

    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    // Get all teams that have submitted PDFs
    const teamsSnapshot = await db
      .collection('team-registrations')
      .where('submittedPdf', '!=', null)
      .get();

    console.log(`📋 Found ${teamsSnapshot.size} teams with submitted PDFs\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const teamDoc of teamsSnapshot.docs) {
      const teamData = teamDoc.data();
      const teamName = teamData.teamName;
      const submittedPdf = teamData.submittedPdf;

      if (!submittedPdf || !submittedPdf.fileUrl) {
        console.log(`⚠️  ${teamName}: No PDF URL`);
        continue;
      }

      try {
        // Use team name as filename
        const outputFilename = `${teamName}.pdf`;
        const outputPath = path.join(OUTPUT_DIR, outputFilename);

        console.log(`📥 Downloading: ${teamName}`);
        console.log(`   From: ${submittedPdf.fileUrl}`);
        console.log(`   To: ${outputFilename}`);

        // Download file
        await downloadFile(submittedPdf.fileUrl, outputPath);

        const stats = fs.statSync(outputPath);
        console.log(`   ✅ Success! Size: ${(stats.size / 1024).toFixed(2)} KB\n`);
        successCount++;
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}\n`);
        errorCount++;
      }
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n✅ Sync complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Output directory: ${OUTPUT_DIR}\n`);

    // List all files in output directory
    const files = fs.readdirSync(OUTPUT_DIR);
    console.log(`📁 Files in ${OUTPUT_DIR}:`);
    files.forEach((file) => {
      const filePath = path.join(OUTPUT_DIR, file);
      const stats = fs.statSync(filePath);
      console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

syncTeamPDFs();
