const { ethers } = require('ethers');

function hashEmail(email) {
  const normalized = email.toLowerCase().trim();
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(normalized));
}

const emails = ['reyerchu@defintek.io', 'reyerchu@gmail.com', 'alphareyer@gmail.com'];

const txHashes = {
  'Token #1': '0x6342a5621f8ef4f404962120200b8276713f3d57eb84e9b54922e50aadec5fa8',
  'Token #2': '0xc1de1c95f1ed322e529507a8091c72d2af7e8ddfe20babfe92f72d15ec35d27e',
  'Token #3': '0x601983a8a19bd27bd21845ef1bec38ee2b7e1fc7a44a04ee949d06367040fe17',
};

console.log('🔍 匹配 Email 與鏈上的 emailHash...\n');

// 計算每個 email 的 hash
const emailHashes = {};
emails.forEach((email) => {
  const hash = hashEmail(email);
  emailHashes[email] = hash;
  console.log(`${email}:`);
  console.log(`  ${hash}\n`);
});

console.log('\n📊 匹配結果:\n');

for (const [token, txHash] of Object.entries(txHashes)) {
  console.log(`${token} (${txHash}):`);

  let matched = false;
  for (const [email, emailHash] of Object.entries(emailHashes)) {
    if (emailHash.toLowerCase() === txHash.toLowerCase()) {
      console.log(`  ✅ 匹配: ${email}\n`);
      matched = true;
      break;
    }
  }

  if (!matched) {
    console.log(`  ❌ 沒有匹配到已知 email\n`);
  }
}
