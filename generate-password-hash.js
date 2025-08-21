#!/usr/bin/env node

/**
 * Simple password hash generator for D1 admin setup
 * Usage: node generate-password-hash.js "your-password"
 */

const crypto = require('crypto');

function simpleHash(password) {
  // Simple SHA-256 hash to match the D1 auth implementation
  return crypto.createHash('sha256').update(password).digest('hex');
}

const password = process.argv[2];

if (!password) {
  console.log('Usage: node generate-password-hash.js "your-password"');
  console.log('');
  console.log('This generates a simple hash for development.');
  console.log('For production, use proper bcrypt hashing.');
  process.exit(1);
}

const hash = simpleHash(password);
console.log('Password hash:', hash);
console.log('');
console.log('Update your setup-d1-admin.sql file with this hash:');
console.log(`'${hash}'`);