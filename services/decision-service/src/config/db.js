const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('[DB] No MONGO_URI provided. Skipping MongoDB connection.');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log(`[DB] Connected to MongoDB: ${uri.split('@').pop()}`);
  } catch (err) {
    console.error(`[DB] MongoDB connection error: ${err.message}`);
    // Do not crash immediately in dev to allow health checks
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

module.exports = {
  connectDB
};
