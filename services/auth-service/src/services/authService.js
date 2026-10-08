const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_ev_2026_change_in_prod';

function generateUserId() {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `U${Date.now().toString().slice(-4)}${randomSuffix}`;
}

function generateToken(user) {
  const payload = {
    userId: user.userId,
    role: user.role,
    email: user.email
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d', algorithm: 'HS256' });
}

async function register({ name, email, password }) {
  if (!name || !email || !password) {
    const err = new Error('Name, email, and password are required');
    err.status = 400;
    throw err;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const err = new Error('Email is already registered');
    err.status = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = generateUserId();

  const user = await User.create({
    userId,
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: 'USER' // per RULEBOOK 6: role forced to USER on public registration
  });

  const token = generateToken(user);
  return { user: user.toJSON(), token };
}

async function login({ email, password }) {
  if (!email || !password) {
    const err = new Error('Email and password are required');
    err.status = 400;
    throw err;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const token = generateToken(user);
  return { user: user.toJSON(), token };
}

async function getProfile(userId) {
  const user = await User.findOne({ userId });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user.toJSON();
}

module.exports = {
  generateUserId,
  generateToken,
  register,
  login,
  getProfile
};
