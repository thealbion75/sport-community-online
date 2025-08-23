#!/usr/bin/env node

// Simple password hash generator for D1 admin setup
// Usage: node generate-password-hash.js "your-password"

import crypto from 'crypto';

function generateBcryptHash(password, rounds = 10) {
  // Simple bcrypt-like hash using Node.js crypto
  // For production, use proper bcrypt library
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `$2b$${rounds}$${salt}${hash}`;
}

const password = process.argv[2];

if (!password) {
  console.log('Usage: node generate-password-hash.js "your-password"');
  console.log('Example: node generate-password-hash.js "MySecurePassword123!"');
  process.exit(1);
}

const hash = generateBcryptHash(password);
console.log('\n🔐 Password Hash Generated:');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('\n📋 Copy this hash to setup-d1-admin.sql');
console.log('Replace: $2b$10$example.hash.here');
console.log('With:    ' + hash);