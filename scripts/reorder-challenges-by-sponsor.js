/**
 * Script to reorder challenges based on new sponsor order
 *
 * New order:
 * 1. 國泰金控 (Cathay)
 * 2. Oasis Protocol
 * 3. Self Protocol
 * 4. Zircuit
 * 5. Sui
 * 6. imToken (if exists)
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: process.env.SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.STORAGE_BUCKET,
  });
}

const db = admin.firestore();

// Define the new sponsor order
const sponsorOrder = [
  '國泰金控',
  'Cathay',
  'Oasis Protocol',
  'Oasis',
  'Self Protocol',
  'Self',
  'Zircuit',
  'Sui',
  'imToken',
];

// Function to get priority based on organization name
function getSponsorPriority(organization) {
  const orgLower = organization.toLowerCase();

  // Map variations to canonical names
  if (orgLower.includes('國泰') || orgLower.includes('cathay')) return 0;
  if (orgLower.includes('oasis')) return 1;
  if (orgLower.includes('self')) return 2;
  if (orgLower.includes('zircuit')) return 3;
  if (orgLower.includes('sui')) return 4;
  if (orgLower.includes('imtoken')) return 5;

  return 999; // Unknown organizations go to the end
}

async function reorderChallenges() {
  try {
    console.log('📋 Fetching all challenges...');

    // Get all challenges
    const snapshot = await db.collection('challenges').get();

    if (snapshot.empty) {
      console.log('⚠️  No challenges found in database');
      return;
    }

    const challenges = [];
    snapshot.forEach((doc) => {
      challenges.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`\n📊 Found ${challenges.length} challenges\n`);

    // Sort challenges by new sponsor order
    challenges.sort((a, b) => {
      const priorityA = getSponsorPriority(a.organization);
      const priorityB = getSponsorPriority(a.organization);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If same organization, keep original rank order
      return (a.rank || 0) - (b.rank || 0);
    });

    // Display current and new order
    console.log('📝 Current vs New Order:\n');
    console.log('  Current Rank | New Rank | Organization | Title');
    console.log('  ' + '-'.repeat(70));

    challenges.forEach((challenge, newIndex) => {
      console.log(
        `  ${String(challenge.rank || '?').padStart(12)} | ${String(newIndex).padStart(
          8,
        )} | ${challenge.organization.padEnd(20)} | ${challenge.title.substring(0, 30)}`,
      );
    });

    console.log('\n');

    // Ask for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question('❓ Do you want to update these rankings? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        console.log('\n🔄 Updating challenges...\n');

        // Update each challenge with new rank
        const batch = db.batch();
        let updateCount = 0;

        challenges.forEach((challenge, newIndex) => {
          if (challenge.rank !== newIndex) {
            const docRef = db.collection('challenges').doc(challenge.id);
            batch.update(docRef, { rank: newIndex });
            updateCount++;
            console.log(`  ✓ ${challenge.organization}: rank ${challenge.rank} → ${newIndex}`);
          }
        });

        if (updateCount > 0) {
          await batch.commit();
          console.log(`\n✅ Successfully updated ${updateCount} challenges!`);
        } else {
          console.log('\n✅ All challenges already in correct order!');
        }
      } else {
        console.log('\n❌ Update cancelled');
      }

      readline.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

reorderChallenges();
