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
 * Upload NFT image to IPFS and update database
 *
 * Usage:
 *   node upload-nft-image-to-ipfs.js <campaignId> <imagePath>
 *
 * Example:
 *   node upload-nft-image-to-ipfs.js gowcTOCfgjEwHWzvg3ss /path/to/image.jpg
 */

async function uploadImageToIPFS(imagePath) {
  try {
    const FormData = require('form-data');
    const fetch = require('node-fetch');

    // Read environment variables
    const PINATA_JWT = process.env.PINATA_JWT;
    if (!PINATA_JWT) {
      throw new Error('PINATA_JWT not found in environment variables');
    }

    console.log('📤 Uploading image to IPFS...');

    // Read image file
    const imageBuffer = fs.readFileSync(imagePath);
    const fileName = path.basename(imagePath);

    // Create FormData
    const formData = new FormData();
    formData.append('file', imageBuffer, {
      filename: fileName,
      contentType: 'image/' + path.extname(imagePath).slice(1),
    });

    // Upload to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`IPFS upload failed: ${errorText}`);
    }

    const result = await response.json();
    const imageCID = result.IpfsHash;
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageCID}`;

    console.log('✅ Image uploaded to IPFS');
    console.log('   CID:', imageCID);
    console.log('   URL:', imageUrl);

    return {
      imageCID,
      imageUrl,
    };
  } catch (error) {
    console.error('❌ Error uploading to IPFS:', error);
    throw error;
  }
}

async function updateCampaignImage(campaignId, imageUrl, imageCID) {
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

    // Update deployment progress if exists
    if (campaignData.deploymentProgress) {
      await campaignRef.update({
        'deploymentProgress.ipfs.imageCID': imageCID,
        'deploymentProgress.ipfs.imageUrl': imageUrl,
      });
    }

    console.log('✅ Campaign updated');
    console.log('   New imageUrl:', imageUrl);
  } catch (error) {
    console.error('❌ Error updating campaign:', error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.error('Usage: node upload-nft-image-to-ipfs.js <campaignId> <imagePath>');
    console.error('');
    console.error('Example:');
    console.error('  node upload-nft-image-to-ipfs.js gowcTOCfgjEwHWzvg3ss /path/to/image.jpg');
    process.exit(1);
  }

  const [campaignId, imagePath] = args;

  console.log('\n🚀 Starting NFT image upload process...');
  console.log('');
  console.log('Campaign ID:', campaignId);
  console.log('Image Path:', imagePath);
  console.log('');

  // Check if image file exists
  if (!fs.existsSync(imagePath)) {
    console.error('❌ Image file not found:', imagePath);
    process.exit(1);
  }

  const stats = fs.statSync(imagePath);
  console.log('Image Size:', (stats.size / 1024).toFixed(2), 'KB');
  console.log('');

  try {
    // Step 1: Upload to IPFS
    const { imageCID, imageUrl } = await uploadImageToIPFS(imagePath);

    // Step 2: Update database
    await updateCampaignImage(campaignId, imageUrl, imageCID);

    console.log('\n✅ All done!');
    console.log('');
    console.log('You can now view the NFT page with the updated image:');
    console.log(`https://hackathon.com.tw/nft/${campaignId}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Process failed:', error.message);
    process.exit(1);
  }
}

main();
