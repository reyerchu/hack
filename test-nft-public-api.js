/**
 * Test NFT Public API
 *
 * This script tests the public NFT API endpoints to verify they work correctly
 * without authentication.
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3009';

async function testNFTPublicAPI() {
  console.log('🧪 Testing NFT Public API...\n');

  try {
    // Step 1: Get first campaign ID from admin API (for testing purposes)
    console.log('📋 Step 1: Fetching campaign list...');

    // Note: This would normally require admin auth, but we'll try to get a campaign ID another way
    // For now, let's try to list campaigns (this will fail if not admin, but that's ok for this test)

    console.log('   For this test, you need to provide a campaign ID manually.');
    console.log('   You can get it from: http://localhost:3009/admin/nft/campaigns\n');

    // Get campaign ID from command line
    const campaignId = process.argv[2];

    if (!campaignId) {
      console.log('❌ Please provide a campaign ID as argument:');
      console.log('   node test-nft-public-api.js <campaignId>');
      console.log('\n   Example:');
      console.log('   node test-nft-public-api.js abc123xyz\n');
      process.exit(1);
    }

    // Step 2: Test public campaign endpoint
    console.log(`📋 Step 2: Testing public campaign endpoint...`);
    console.log(`   GET /api/nft/campaigns/${campaignId}`);

    const campaignRes = await fetch(`${BASE_URL}/api/nft/campaigns/${campaignId}`);
    const campaignStatus = campaignRes.status;

    console.log(`   Status: ${campaignStatus}`);

    if (campaignStatus === 200) {
      const campaignData = await campaignRes.json();
      console.log('   ✅ Campaign data retrieved successfully');
      console.log('   Campaign:', {
        id: campaignData.campaign.id,
        name: campaignData.campaign.name,
        network: campaignData.campaign.network,
        supply: `${campaignData.campaign.currentSupply}/${campaignData.campaign.maxSupply}`,
      });
    } else {
      const error = await campaignRes.text();
      console.log('   ❌ Failed to retrieve campaign');
      console.log('   Error:', error);
      process.exit(1);
    }

    // Step 3: Test mints endpoint
    console.log(`\n📋 Step 3: Testing mints endpoint...`);
    console.log(`   GET /api/nft/campaigns/${campaignId}/mints`);

    const mintsRes = await fetch(`${BASE_URL}/api/nft/campaigns/${campaignId}/mints`);
    const mintsStatus = mintsRes.status;

    console.log(`   Status: ${mintsStatus}`);

    if (mintsStatus === 200) {
      const mintsData = await mintsRes.json();
      console.log('   ✅ Mints data retrieved successfully');
      console.log('   Total mints:', mintsData.total);

      if (mintsData.total > 0) {
        console.log('   Sample mint:', {
          tokenId: mintsData.mints[0].tokenId,
          userEmail: mintsData.mints[0].userEmail,
          mintedAt: mintsData.mints[0].mintedAt,
        });
      }
    } else {
      const error = await mintsRes.text();
      console.log('   ❌ Failed to retrieve mints');
      console.log('   Error:', error);
    }

    // Step 4: Test public page URL
    console.log(`\n📋 Step 4: Testing public page URL...`);
    const pageUrl = `${BASE_URL}/nft/${campaignId}`;
    console.log(`   URL: ${pageUrl}`);

    const pageRes = await fetch(pageUrl);
    const pageStatus = pageRes.status;

    console.log(`   Status: ${pageStatus}`);

    if (pageStatus === 200) {
      console.log('   ✅ Public page accessible');
    } else {
      console.log('   ❌ Public page not accessible');
    }

    console.log('\n✅ All tests completed!\n');
    console.log('🌐 You can now visit the public page at:');
    console.log(`   ${pageUrl}\n`);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testNFTPublicAPI();
