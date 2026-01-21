require('dotenv').config();

const url = process.env.DATABASE_URL || '';
console.log('--- DEBUG INFO ---');
console.log('URL Length:', url.length);
console.log('Starts with postgres://:', url.startsWith('postgres://'));
console.log('Hostname found:', new URL(url).hostname);
console.log('Character codes of first 20 chars:', url.substring(0, 20).split('').map(c => c.charCodeAt(0)));
console.log('--- END DEBUG ---');
