#!/usr/bin/env node

/**
 * Delete old NFT campaigns except the specified one
 * Usage: node scripts/delete-old-nft-campaigns.js
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin using environment variables
if (!admin.apps.length) {
  let privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ SERVICE_ACCOUNT_PRIVATE_KEY is missing');
    process.exit(1);
  }

  // Handle private key format: remove quotes and replace escaped newlines
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

  console.log('✅ Firebase Admin SDK initialized\n');
}

const db = admin.firestore();

// Campaign to KEEP
const KEEP_CAMPAIGN_ID = 'bxquPDEBFDk1JJ8rfy3y';

async function deleteOldCampaigns() {
  try {
    console.log('🔍 Fetching all NFT campaigns...\n');

    // Get all campaigns
    const campaignsSnapshot = await db.collection('nft-campaigns').get();

    console.log(`📊 Total campaigns found: ${campaignsSnapshot.size}`);
    console.log(`✅ Keeping campaign: ${KEEP_CAMPAIGN_ID}\n`);

    let deletedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Process each campaign
    for (const doc of campaignsSnapshot.docs) {
      const campaignId = doc.id;
      const campaignData = doc.data();

      if (campaignId === KEEP_CAMPAIGN_ID) {
        console.log(`⏭️  SKIPPING: ${campaignId} (${campaignData.name || 'No name'})`);
        skippedCount++;
        continue;
      }

      try {
        console.log(`🗑️  Deleting: ${campaignId} (${campaignData.name || 'No name'})`);

        // Delete the campaign document
        await db.collection('nft-campaigns').doc(campaignId).delete();

        // Delete associated subcollections if they exist
        try {
          // Delete whitelist emails
          const whitelistSnapshot = await db
            .collection('nft-campaigns')
            .doc(campaignId)
            .collection('whitelist')
            .get();

          if (!whitelistSnapshot.empty) {
            const batch = db.batch();
            whitelistSnapshot.docs.forEach((doc) => {
              batch.delete(doc.ref);
            });
            await batch.commit();
            console.log(`   ✓ Deleted ${whitelistSnapshot.size} whitelist entries`);
          }
        } catch (err) {
          console.log(`   ⚠️  No whitelist subcollection or error: ${err.message}`);
        }

        // Delete mint records
        try {
          const mintsSnapshot = await db
            .collection('nft-campaigns')
            .doc(campaignId)
            .collection('mints')
            .get();

          if (!mintsSnapshot.empty) {
            const batch = db.batch();
            mintsSnapshot.docs.forEach((doc) => {
              batch.delete(doc.ref);
            });
            await batch.commit();
            console.log(`   ✓ Deleted ${mintsSnapshot.size} mint records`);
          }
        } catch (err) {
          console.log(`   ⚠️  No mints subcollection or error: ${err.message}`);
        }

        console.log(`   ✅ Campaign ${campaignId} deleted successfully\n`);
        deletedCount++;
      } catch (error) {
        console.error(`   ❌ Error deleting ${campaignId}:`, error.message);
        errors.push({ campaignId, error: error.message });
      }
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📋 DELETION SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ Campaigns deleted: ${deletedCount}`);
    console.log(`⏭️  Campaigns skipped (kept): ${skippedCount}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log('═══════════════════════════════════════════════════\n');

    if (errors.length > 0) {
      console.log('❌ Errors encountered:');
      errors.forEach(({ campaignId, error }) => {
        console.log(`   - ${campaignId}: ${error}`);
      });
    }

    console.log('✅ Cleanup complete!\n');
    console.log(`🔗 Remaining campaign: https://hackathon.com.tw/nft/${KEEP_CAMPAIGN_ID}`);
    console.log(`🔗 Admin page: https://hackathon.com.tw/admin/nft/campaigns\n`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Confirmation prompt
console.log('\n⚠️  WARNING: This will DELETE all NFT campaigns except:');
console.log(`   ${KEEP_CAMPAIGN_ID}`);
console.log('\n🔴 This action CANNOT be undone!\n');
console.log('Starting deletion in 3 seconds...\n');

setTimeout(() => {
  deleteOldCampaigns()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}, 3000);
