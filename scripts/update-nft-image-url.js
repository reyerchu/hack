const path = require('path');
const fs = require('fs');

// Add parent directory to require path to access lib
require('module').globalPaths.push(path.resolve(__dirname, '..'));

const initializeApi = require('../lib/admin/init').default;
const { firestore } = require('firebase-admin');

// Initialize Firebase
initializeApi();
const db = firestore();

/**
 * Update NFT campaign image URL in database
 *
 * Usage:
 *   node update-nft-image-url.js <campaignId> <sourceImagePath> [--ipfs]
 *
 * Examples:
 *   # Copy image to public/nft-images/ and update DB
 *   node update-nft-image-url.js gowcTOCfgjEwHWzvg3ss /path/to/image.jpg
 *
 *   # Or provide an existing URL directly
 *   node update-nft-image-url.js gowcTOCfgjEwHWzvg3ss https://example.com/image.jpg --url
 */

async function copyImageToPublic(sourcePath) {
  try {
    const fileName = `nft-${Date.now()}-${Math.floor(Math.random() * 1000000000)}${path.extname(
      sourcePath,
    )}`;
    const destPath = path.join(__dirname, '..', 'public', 'nft-images', fileName);
    const imageUrl = `/nft-images/${fileName}`;

    console.log('📁 Copying image to public directory...');
    console.log('   Source:', sourcePath);
    console.log('   Dest:', destPath);

    // Ensure directory exists
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Copy file
    fs.copyFileSync(sourcePath, destPath);

    const stats = fs.statSync(destPath);
    console.log('✅ Image copied');
    console.log('   Size:', (stats.size / 1024).toFixed(2), 'KB');
    console.log('   URL:', imageUrl);

    return imageUrl;
  } catch (error) {
    console.error('❌ Error copying image:', error);
    throw error;
  }
}

async function updateCampaignImage(campaignId, imageUrl) {
  try {
    console.log('\n📝 Updating campaign in database...');

    const campaignRef = db.collection('nft-campaigns').doc(campaignId);
    const campaignDoc = await campaignRef.get();

    if (!campaignDoc.exists) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    const campaignData = campaignDoc.data();
    console.log('   Campaign:', campaignData.name);
    console.log('   Old imageUrl:', campaignData.imageUrl || '(none)');

    // Update campaign
    await campaignRef.update({
      imageUrl: imageUrl,
      updatedAt: new Date(),
    });

    console.log('✅ Campaign updated');
    console.log('   New imageUrl:', imageUrl);
  } catch (error) {
    console.error('❌ Error updating campaign:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node update-nft-image-url.js <campaignId> <sourceImagePath> [--url]');
    console.error('');
    console.error('Examples:');
    console.error('  # Copy local image to public/nft-images/');
    console.error('  node update-nft-image-url.js gowcTOCfgjEwHWzvg3ss /path/to/image.jpg');
    console.error('');
    console.error('  # Use existing URL');
    console.error(
      '  node update-nft-image-url.js gowcTOCfgjEwHWzvg3ss https://example.com/image.jpg --url',
    );
    process.exit(1);
  }

  const campaignId = args[0];
  const sourcePathOrUrl = args[1];
  const isUrl = args.includes('--url');

  console.log('\n🚀 Starting NFT image update process...');
  console.log('');
  console.log('Campaign ID:', campaignId);
  console.log('Source:', sourcePathOrUrl);
  console.log('Mode:', isUrl ? 'URL' : 'File Copy');
  console.log('');

  try {
    let imageUrl;

    if (isUrl) {
      // Use URL directly
      imageUrl = sourcePathOrUrl;
      console.log('📎 Using provided URL:', imageUrl);
    } else {
      // Check if source file exists
      if (!fs.existsSync(sourcePathOrUrl)) {
        console.error('❌ Image file not found:', sourcePathOrUrl);
        process.exit(1);
      }

      const stats = fs.statSync(sourcePathOrUrl);
      console.log('Image Size:', (stats.size / 1024).toFixed(2), 'KB');
      console.log('');

      // Copy image to public directory
      imageUrl = await copyImageToPublic(sourcePathOrUrl);
    }

    // Update database
    await updateCampaignImage(campaignId, imageUrl);

    console.log('\n✅ All done!');
    console.log('');
    console.log('You can now view the NFT page with the updated image:');
    console.log(`https://hackathon.com.tw/nft/${campaignId}`);
    console.log('');
    console.log('⚠️  Note: If using local file path, make sure to:');
    console.log('   1. Keep the file in public/nft-images/ (not in git)');
    console.log('   2. Or better: run upload-nft-image-to-ipfs.js to upload to IPFS');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Process failed:', error.message);
    process.exit(1);
  }
}

main();
