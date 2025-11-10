#!/usr/bin/env node
/**
 * Test script for IPFS upload API
 * Tests the /api/admin/nft/upload-to-ipfs endpoint
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function testIPFSUpload() {
  console.log('\n🧪 Testing IPFS Upload API\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Create a test image (1x1 pixel PNG)
  const testImagePath = path.join(__dirname, 'test-nft-image.png');

  // Create a simple 1x1 red pixel PNG
  const pngData = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // PNG signature
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52, // IHDR chunk
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x01, // 1x1 dimensions
    0x08,
    0x02,
    0x00,
    0x00,
    0x00,
    0x90,
    0x77,
    0x53,
    0xde,
    0x00,
    0x00,
    0x00,
    0x0c,
    0x49,
    0x44,
    0x41, // IDAT chunk
    0x54,
    0x08,
    0xd7,
    0x63,
    0xf8,
    0xcf,
    0xc0,
    0x00,
    0x00,
    0x03,
    0x01,
    0x01,
    0x00,
    0x18,
    0xdd,
    0x8d,
    0xb4,
    0x00,
    0x00,
    0x00,
    0x00,
    0x49,
    0x45,
    0x4e, // IEND chunk
    0x44,
    0xae,
    0x42,
    0x60,
    0x82,
  ]);

  fs.writeFileSync(testImagePath, pngData);
  console.log('✅ Created test image:', testImagePath);

  // Prepare form data
  const formData = new FormData();
  formData.append('image', fs.createReadStream(testImagePath));
  formData.append('name', 'Test IPFS NFT Collection');
  formData.append('description', 'This is a test NFT collection for IPFS integration');
  formData.append('maxSupply', '5');

  console.log('\n📤 Uploading to IPFS...\n');
  console.log('Request details:');
  console.log('  • Name: Test IPFS NFT Collection');
  console.log('  • Description: Test NFT collection');
  console.log('  • Max Supply: 5 tokens');
  console.log('  • Image: test-nft-image.png\n');

  try {
    const response = await fetch('http://localhost:3009/api/admin/nft/upload-to-ipfs', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    const result = await response.json();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (result.success) {
      console.log('✅ IPFS Upload Successful!\n');
      console.log('📦 Results:');
      console.log('  • Image CID:', result.imageCID);
      console.log('  • Metadata CID:', result.metadataCID);
      console.log('  • Base URI:', result.baseURI);
      console.log('\n🌐 IPFS Gateway URLs:');
      console.log('  • Image:', `https://gateway.pinata.cloud/ipfs/${result.imageCID}`);
      console.log(
        '  • Metadata (Token 1):',
        `https://gateway.pinata.cloud/ipfs/${result.metadataCID}/1.json`,
      );
      console.log(
        '  • Metadata (Token 2):',
        `https://gateway.pinata.cloud/ipfs/${result.metadataCID}/2.json`,
      );
      console.log('\n📝 Generated Metadata Structure:');
      console.log('  {');
      console.log('    "name": "Test IPFS NFT Collection #1",');
      console.log('    "description": "This is a test NFT collection for IPFS integration",');
      console.log(`    "image": "ipfs://${result.imageCID}",`);
      console.log('    "attributes": [');
      console.log('      { "trait_type": "Edition", "value": "1 of 5" },');
      console.log('      { "trait_type": "Collection", "value": "Test IPFS NFT Collection" }');
      console.log('    ]');
      console.log('  }');
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n✅ Test Passed! IPFS integration is working correctly!\n');
    } else {
      console.log('❌ IPFS Upload Failed\n');
      console.log('Error:', result.error);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n❌ Test Failed\n');
    }
  } catch (error) {
    console.log('❌ Request Failed\n');
    console.error('Error:', error.message);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n❌ Test Failed\n');
  } finally {
    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('🧹 Cleaned up test image\n');
    }
  }
}

// Run the test
testIPFSUpload().catch(console.error);
