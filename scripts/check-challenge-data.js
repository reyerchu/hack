const admin = require('firebase-admin');
const fs = require('fs');

// Read environment variables
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach((line) => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();
      value = value.replace(/^["']|["']$/g, '');
      envVars[key.trim()] = value;
    }
  }
});

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: envVars.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: envVars.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: envVars.SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function checkChallenge() {
  try {
    const challengeId = 'kLLbqDvdbi7xmrln9Uql';
    const doc = await db.collection('extended-challenges').doc(challengeId).get();

    if (!doc.exists) {
      console.log('Challenge not found');
      return;
    }

    const data = doc.data();
    console.log('\n=== Challenge Data ===');
    console.log('ID:', challengeId);
    console.log('Title:', data.title);
    console.log('\nSubmission Requirements:');
    console.log('Type:', typeof data.submissionRequirements);
    console.log('Value:', JSON.stringify(data.submissionRequirements, null, 2));
    console.log('Length:', data.submissionRequirements?.length || 0);
    console.log('Is Empty String:', data.submissionRequirements === '');
    console.log('Is Undefined:', data.submissionRequirements === undefined);
    console.log('Is Null:', data.submissionRequirements === null);

    console.log('\nEvaluation Criteria:');
    console.log('Type:', typeof data.evaluationCriteria);
    console.log('Value:', JSON.stringify(data.evaluationCriteria, null, 2));
    console.log('Is Array:', Array.isArray(data.evaluationCriteria));
    console.log(
      'Array Length:',
      Array.isArray(data.evaluationCriteria) ? data.evaluationCriteria.length : 'N/A',
    );
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkChallenge();
