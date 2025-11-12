/**
 * Verify Merkle Proof for NFT Campaign
 *
 * Usage: node scripts/verify-merkle-proof.js <campaignId> <email>
 *
 * This script will:
 * 1. Fetch the campaign from Firestore
 * 2. Get the Merkle root and proof for the email
 * 3. Verify the proof locally
 * 4. Check if it matches what would be sent to the smart contract
 */

const admin = require('firebase-admin');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// Hash email function (same as in merkleTree.ts)
function hashEmail(email) {
  const normalized = email.toLowerCase().trim();
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(normalized));
}

async function verifyMerkleProof(campaignId, email) {
  try {
    console.log('\n🔍 Verifying Merkle Proof');
    console.log('='.repeat(50));
    console.log(`Campaign ID: ${campaignId}`);
    console.log(`Email: ${email}`);
    console.log('='.repeat(50));

    // Fetch campaign
    const campaignDoc = await db.collection('nft-campaigns').doc(campaignId).get();

    if (!campaignDoc.exists) {
      console.error('❌ Campaign not found');
      return;
    }

    const campaign = campaignDoc.data();
    const normalizedEmail = email.toLowerCase().trim();

    console.log(`\n📋 Campaign: ${campaign.name}`);
    console.log(`📧 Eligible emails: ${campaign.eligibleEmails?.length || 0}`);
    console.log(`🌳 Merkle root exists: ${!!campaign.merkleRoot}`);
    console.log(`📝 Merkle proofs exist: ${!!campaign.merkleProofs}`);

    if (!campaign.merkleRoot) {
      console.error('\n❌ Merkle root not set for this campaign');
      return;
    }

    if (!campaign.merkleProofs) {
      console.error('\n❌ Merkle proofs not generated for this campaign');
      return;
    }

    // Get proof for email
    const proof = campaign.merkleProofs[normalizedEmail];

    if (!proof) {
      console.error(`\n❌ No proof found for email: ${normalizedEmail}`);
      console.log('\n📊 Available emails in merkleProofs (first 10):');
      Object.keys(campaign.merkleProofs)
        .slice(0, 10)
        .forEach((e, i) => {
          console.log(`  ${i + 1}. ${e}`);
        });

      // Check if email is in eligibleEmails
      const isInEligible = campaign.eligibleEmails?.some(
        (e) => e.toLowerCase().trim() === normalizedEmail,
      );
      console.log(`\n🔎 Email in eligibleEmails: ${isInEligible}`);

      return;
    }

    // Calculate email hash
    const emailHash = hashEmail(normalizedEmail);

    console.log(`\n✅ Proof found!`);
    console.log(`🔐 Email hash: ${emailHash}`);
    console.log(`📋 Proof length: ${proof.length}`);
    console.log(`🌳 Merkle root: ${campaign.merkleRoot}`);

    // Verify proof locally
    const isValid = MerkleTree.verify(proof, emailHash, campaign.merkleRoot, keccak256, {
      sortPairs: true,
    });

    console.log(`\n🔍 Local verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

    if (!isValid) {
      console.error('\n❌ CRITICAL: Proof is INVALID!');
      console.log('This means the proof will be rejected by the smart contract.');

      // Try to regenerate the tree and see if we get the same root
      console.log('\n🔄 Regenerating Merkle Tree to compare...');

      const eligibleEmails = campaign.eligibleEmails || [];
      const leaves = eligibleEmails.map((e) => hashEmail(e));
      const tree = new MerkleTree(leaves, keccak256, {
        sortPairs: true,
        hashLeaves: false,
      });

      const regeneratedRoot = tree.getHexRoot();
      console.log(`🌳 Stored root:      ${campaign.merkleRoot}`);
      console.log(`🌳 Regenerated root: ${regeneratedRoot}`);
      console.log(
        `🔍 Roots match: ${campaign.merkleRoot === regeneratedRoot ? '✅ YES' : '❌ NO'}`,
      );

      if (campaign.merkleRoot !== regeneratedRoot) {
        console.error('\n❌ CRITICAL: The stored Merkle root does NOT match the regenerated root!');
        console.error(
          'This suggests the eligibleEmails list has changed since the Merkle tree was generated.',
        );
        console.error('You need to regenerate the Merkle tree for this campaign.');
      } else {
        // Try getting the proof from regenerated tree
        const regeneratedProof = tree.getHexProof(emailHash);
        console.log(`\n📋 Stored proof length:      ${proof.length}`);
        console.log(`📋 Regenerated proof length: ${regeneratedProof.length}`);

        const isValidRegenerated = MerkleTree.verify(
          regeneratedProof,
          emailHash,
          regeneratedRoot,
          keccak256,
          { sortPairs: true },
        );
        console.log(`🔍 Regenerated proof valid: ${isValidRegenerated ? '✅ YES' : '❌ NO'}`);
      }
    } else {
      console.log('\n✅ SUCCESS: The proof is valid and will work with the smart contract!');
      console.log('\nYou can use these values for minting:');
      console.log(`  emailHash: "${emailHash}"`);
      console.log(`  proof: [${proof.map((p) => `"${p}"`).join(', ')}]`);
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

// Get command line arguments
const campaignId = process.argv[2];
const email = process.argv[3];

if (!campaignId || !email) {
  console.error('Usage: node scripts/verify-merkle-proof.js <campaignId> <email>');
  console.error(
    'Example: node scripts/verify-merkle-proof.js bxquPDEBFDk1JJ8rfy3y reyerchu@defintek.io',
  );
  process.exit(1);
}

verifyMerkleProof(campaignId, email);
