require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

const defaultUsers = [
  {
    userId: 'U001',
    name: 'System Admin',
    email: 'admin@ev.com',
    password: 'Admin@123',
    role: 'SYSTEM_ADMIN'
  },
  {
    userId: 'U002',
    name: 'Demo User',
    email: 'user@ev.com',
    password: 'User@123',
    role: 'USER'
  }
];

async function seedUsers() {
  for (const u of defaultUsers) {
    const existing = await User.findOne({ email: u.email });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      await User.create({
        userId: u.userId,
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role
      });
      console.log(`[Seed] Created ${u.role}: ${u.email} (${u.userId})`);
    } else {
      console.log(`[Seed] User already exists: ${u.email}`);
    }
  }
}

async function runSeed() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/auth_db';
  try {
    await mongoose.connect(uri);
    console.log(`[Seed] Connected to ${uri}`);
    await seedUsers();
    console.log('[Seed] Seeding completed.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`[Seed] Error: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  runSeed();
}

module.exports = { seedUsers, defaultUsers };
