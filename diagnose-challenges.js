/**
 * Diagnostic script to check challenge status in database
 * Run: node diagnose-challenges.js
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Load .env file manually
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      value = value.replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  const projectId = process.env.SERVICE_ACCOUNT_PROJECT_ID;
  const clientEmail = process.env.SERVICE_ACCOUNT_CLIENT_EMAIL;
  let privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Missing Firebase credentials in .env file');
    console.error(
      'Required: SERVICE_ACCOUNT_PROJECT_ID, SERVICE_ACCOUNT_CLIENT_EMAIL, SERVICE_ACCOUNT_PRIVATE_KEY',
    );
    process.exit(1);
  }

  // Process private key format
  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  console.log('✅ Firebase Admin initialized successfully');
}

const db = admin.firestore();

async function diagnoseChallenges() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 CHALLENGE STATUS DIAGNOSTIC');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Fetch all tracks
    const tracksSnapshot = await db.collection('tracks').get();
    console.log(`📊 Total Tracks: ${tracksSnapshot.size}\n`);

    const trackMap = {};
    tracksSnapshot.forEach((doc) => {
      const data = doc.data();
      trackMap[data.trackId || doc.id] = {
        id: doc.id,
        trackId: data.trackId || doc.id,
        name: data.name,
        status: data.status,
      };
    });

    // Fetch all challenges
    const challengesSnapshot = await db.collection('extended-challenges').get();
    console.log(`📊 Total Challenges: ${challengesSnapshot.size}\n`);

    // Group by status
    const byStatus = {
      published: [],
      active: [],
      draft: [],
      other: [],
      noStatus: [],
    };

    const byTrack = {};

    challengesSnapshot.forEach((doc) => {
      const data = doc.data();
      const challenge = {
        id: doc.id,
        title: data.title || '(No Title)',
        trackId: data.trackId || '(No TrackId)',
        status: data.status || '(No Status)',
        hasTitle: !!data.title,
        hasTrackId: !!data.trackId,
        hasStatus: !!data.status,
      };

      // Group by status
      if (!data.status) {
        byStatus.noStatus.push(challenge);
      } else if (data.status === 'published') {
        byStatus.published.push(challenge);
      } else if (data.status === 'active') {
        byStatus.active.push(challenge);
      } else if (data.status === 'draft') {
        byStatus.draft.push(challenge);
      } else {
        byStatus.other.push(challenge);
      }

      // Group by track
      if (data.trackId) {
        if (!byTrack[data.trackId]) {
          byTrack[data.trackId] = [];
        }
        byTrack[data.trackId].push(challenge);
      }
    });

    // Print status summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 CHALLENGES BY STATUS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`✅ Published: ${byStatus.published.length}`);
    byStatus.published.forEach((c) => {
      console.log(`   - ${c.title} (trackId: ${c.trackId})`);
    });

    console.log(`\n✅ Active: ${byStatus.active.length}`);
    byStatus.active.forEach((c) => {
      console.log(`   - ${c.title} (trackId: ${c.trackId})`);
    });

    console.log(`\n📝 Draft: ${byStatus.draft.length}`);
    byStatus.draft.forEach((c) => {
      console.log(`   - ${c.title} (trackId: ${c.trackId})`);
    });

    console.log(`\n❓ No Status: ${byStatus.noStatus.length}`);
    byStatus.noStatus.forEach((c) => {
      console.log(`   - ${c.title} (trackId: ${c.trackId})`);
    });

    console.log(`\n⚠️  Other Status: ${byStatus.other.length}`);
    byStatus.other.forEach((c) => {
      console.log(`   - ${c.title} (status: ${c.status}, trackId: ${c.trackId})`);
    });

    // Print by track
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📂 CHALLENGES BY TRACK');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    Object.keys(byTrack).forEach((trackId) => {
      const track = trackMap[trackId];
      const trackName = track ? track.name : '(Unknown Track)';
      const trackStatus = track ? track.status : '(Unknown)';
      const challenges = byTrack[trackId];

      console.log(`\n🏁 ${trackName} (${trackId})`);
      console.log(`   Track Status: ${trackStatus}`);
      console.log(`   Challenges: ${challenges.length}`);

      challenges.forEach((c) => {
        const icon = c.status === 'published' || c.status === 'active' ? '✅' : '❌';
        console.log(`   ${icon} ${c.title} (status: ${c.status})`);
      });
    });

    // Print issues
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  POTENTIAL ISSUES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const issues = [];

    challengesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.title) {
        issues.push(`❌ Challenge ${doc.id}: Missing title`);
      }
      if (!data.trackId) {
        issues.push(`❌ Challenge "${data.title || doc.id}": Missing trackId`);
      }
      if (!data.status) {
        issues.push(
          `⚠️  Challenge "${
            data.title || doc.id
          }": Missing status (will not show in team registration)`,
        );
      }
      if (data.status && data.status !== 'published' && data.status !== 'active') {
        issues.push(
          `⚠️  Challenge "${data.title || doc.id}": Status is "${
            data.status
          }" (will not show in team registration)`,
        );
      }
    });

    if (issues.length === 0) {
      console.log('✅ No issues found!');
    } else {
      issues.forEach((issue) => console.log(issue));
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 RECOMMENDATIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const publishable = byStatus.draft.length + byStatus.noStatus.length + byStatus.other.length;

    if (publishable > 0) {
      console.log(`📌 You have ${publishable} challenge(s) that are not published or active.`);
      console.log('   To make them visible in team registration:');
      console.log('   1. Go to the challenge edit page');
      console.log('   2. Set status to "published" or "active"');
      console.log('   3. Click "保存修改"');
      console.log('   4. Refresh team registration page\n');
    }

    const visibleChallenges = byStatus.published.length + byStatus.active.length;
    console.log(`✅ Currently visible in team registration: ${visibleChallenges} challenge(s)\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

diagnoseChallenges();
