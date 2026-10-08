#!/usr/bin/env node
/**
 * scripts/gen-token.js
 * Generates valid HS256 JWT tokens for development and testing.
 * Uses jsonwebtoken if available, with built-in zero-dependency crypto fallback.
 *
 * Usage:
 *   node scripts/gen-token.js
 *   node scripts/gen-token.js U101 USER user@ev.com
 *   node scripts/gen-token.js A101 SYSTEM_ADMIN admin@ev.com
 */

const crypto = require('crypto');
const path = require('path');

// Try loading dotenv if present
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (e) {
  // Ignore if dotenv is not yet installed
}

const secret = process.env.JWT_SECRET || 'supersecretjwtkey_ev_2026_change_in_prod';

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function generateJwt(payload, secretKey) {
  // Try jsonwebtoken first if available
  try {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, secretKey, { expiresIn: '1d', algorithm: 'HS256' });
  } catch (e) {
    // Zero-dependency pure Node.js fallback (100% compliant HS256 JWT)
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const enrichedPayload = {
      ...payload,
      iat: now,
      exp: now + 86400 // 1 day expiry per RULEBOOK 5
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(enrichedPayload));
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(signatureInput)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${signatureInput}.${signature}`;
  }
}

const args = process.argv.slice(2);

if (args.length >= 3) {
  const [userId, role, email] = args;
  const token = generateJwt({ userId, role, email }, secret);
  console.log(`\nGenerated Token for [${role}] ${userId} (${email}):`);
  console.log(token);
  console.log('\nHeader:');
  console.log(`Authorization: Bearer ${token}\n`);
} else {
  console.log('--- Development Test JWT Tokens (Expires in 1 day) ---');
  
  const userToken = generateJwt({ userId: 'U101', role: 'USER', email: 'user@ev.com' }, secret);
  console.log('\n1. USER (user@ev.com / U101):');
  console.log(`Bearer ${userToken}`);

  const stationAdminToken = generateJwt({ userId: 'SA101', role: 'STATION_ADMIN', email: 'station@ev.com' }, secret);
  console.log('\n2. STATION_ADMIN (station@ev.com / SA101):');
  console.log(`Bearer ${stationAdminToken}`);

  const sysAdminToken = generateJwt({ userId: 'A101', role: 'SYSTEM_ADMIN', email: 'admin@ev.com' }, secret);
  console.log('\n3. SYSTEM_ADMIN (admin@ev.com / A101):');
  console.log(`Bearer ${sysAdminToken}`);

  console.log('\nJWT Secret used:', secret);
}
