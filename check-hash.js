const { emailToHash } = require('./lib/utils/email-hash');

const email = 'alphareyer@gmail.com';
const hash = emailToHash(email);

console.log('Email:', email);
console.log('Hash:', hash);
