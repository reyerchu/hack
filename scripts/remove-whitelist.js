// Script to remove whitelist emails from a campaign
// Usage: node scripts/remove-whitelist.js <campaignId> <email1> <email2> ...

require('dotenv').config({ path: '.env.local' });

const campaignId = process.argv[2];
const emailsToRemove = process.argv.slice(3);

if (!campaignId || emailsToRemove.length === 0) {
  console.log('Usage: node scripts/remove-whitelist.js <campaignId> <email1> <email2> ...');
  process.exit(1);
}

const http = require('http');

const data = JSON.stringify({
  campaignId: campaignId,
  emailsToRemove: emailsToRemove,
});

const options = {
  hostname: 'localhost',
  port: 3008,
  path: '/api/admin/nft/campaigns/remove-whitelist',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('Response:', body);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(data);
req.end();
