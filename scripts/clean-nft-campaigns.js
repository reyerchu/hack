/**
 * Clean All NFT Campaigns
 * 
 * This script removes all NFT campaigns and related data from Firestore
 * Use this to start fresh with NFT campaigns
 */

const admin = require('firebase-admin');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

// Initialize Firebase Admin using environment variables
if (!admin.apps.length) {
  try {
    // Check for required environment variables
    if (
      !process.env.SERVICE_ACCOUNT_PROJECT_ID ||
      !process.env.SERVICE_ACCOUNT_CLIENT_EMAIL ||
      !process.env.SERVICE_ACCOUNT_PRIVATE_KEY
    ) {
      console.error('❌ Missing Firebase Admin environment variables!');
      console.log('\n💡 Please ensure .env.local has:');
      console.log('   - SERVICE_ACCOUNT_PROJECT_ID');
      console.log('   - SERVICE_ACCOUNT_CLIENT_EMAIL');
      console.log('   - SERVICE_ACCOUNT_PRIVATE_KEY\n');
      process.exit(1);
    }

    // Handle private key format
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

    console.log('✅ Firebase Admin initialized\n');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function cleanNFTCampaigns() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                              ║');
  console.log('║   🧹 Cleaning All NFT Campaigns                                              ║');
  console.log('║                                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Get all campaigns
    console.log('📋 Step 1: Fetching all NFT campaigns...\n');
    const campaignsSnapshot = await db.collection('nft-campaigns').get();
    
    if (campaignsSnapshot.empty) {
      console.log('✅ No campaigns found. Database is already clean.\n');
      process.exit(0);
    }

    console.log(`   Found ${campaignsSnapshot.size} campaign(s) to delete:\n`);

    // Display campaigns
    campaignsSnapshot.forEach((doc, index) => {
      const campaign = doc.data();
      console.log(`   ${index + 1}. ${campaign.name}`);
      console.log(`      ID: ${doc.id}`);
      console.log(`      Status: ${campaign.status}`);
      console.log(`      Contract: ${campaign.contractAddress || '(not deployed)'}`);
      console.log('');
    });

    // Step 2: Delete all campaigns
    console.log('🗑️  Step 2: Deleting campaigns...\n');
    
    const deletePromises = [];
    campaignsSnapshot.forEach((doc) => {
      deletePromises.push(doc.ref.delete());
    });

    await Promise.all(deletePromises);
    console.log(`   ✅ Deleted ${deletePromises.length} campaign(s)\n`);

    // Step 3: Clean up mint records
    console.log('🗑️  Step 3: Cleaning up mint records...\n');
    const mintsSnapshot = await db.collection('nft-mints').get();
    
    if (!mintsSnapshot.empty) {
      const mintDeletePromises = [];
      mintsSnapshot.forEach((doc) => {
        mintDeletePromises.push(doc.ref.delete());
      });

      await Promise.all(mintDeletePromises);
      console.log(`   ✅ Deleted ${mintDeletePromises.length} mint record(s)\n`);
    } else {
      console.log('   ℹ️  No mint records found\n');
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Cleanup Complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Campaigns deleted: ${campaignsSnapshot.size}`);
    console.log(`   - Mint records deleted: ${mintsSnapshot.size}`);
    console.log('');
    console.log('🎯 You can now start fresh with NFT campaigns!\n');
    console.log('Next steps:');
    console.log('   1. Visit: http://localhost:3009/admin/nft/campaigns');
    console.log('   2. Click "建立新活動"');
    console.log('   3. Fill in the details and upload an image');
    console.log('   4. Click "一鍵自動設置" to deploy\n');
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                              ║');
    console.log('║   ✅ Database Cleaned Successfully                                           ║');
    console.log('║                                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the cleanup
cleanNFTCampaigns();

