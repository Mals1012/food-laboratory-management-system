const mongoose = require('mongoose');

let mongoServerInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foodlab_lims';
  
  try {
    // Attempt standard connection with 2.5s server selection timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[Database] Connected to external MongoDB at: ${uri}`);
    return;
  } catch (err) {
    console.warn(`[Database] Could not connect to external MongoDB (${err.message}). Starting embedded MongoMemoryServer...`);
  }

  // Graceful fallback to mongodb-memory-server
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServerInstance = await MongoMemoryServer.create();
    const memoryUri = mongoServerInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[Database] Successfully connected to embedded MongoDB at: ${memoryUri}`);
  } catch (memErr) {
    console.error(`[Database] Failed to start embedded MongoDB: ${memErr.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServerInstance) {
    await mongoServerInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
