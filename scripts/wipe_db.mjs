import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://127.0.0.1:27017/obcpmp';

const wipeDb = async () => {
  try {
    console.log(`[Wipe DB] Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('[Wipe DB] Connected successfully.');

    console.log('[Wipe DB] Dropping the entire database...');
    await mongoose.connection.db.dropDatabase();
    
    console.log('[Wipe DB] Database wiped successfully!');
  } catch (err) {
    console.error('[Wipe DB] Error occurred:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('[Wipe DB] Connection closed.');
    process.exit(0);
  }
};

wipeDb();
