import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/obcpmp?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.6.0';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    
    // Drop legacy departmentId_1 unique index on peopsos if it exists
    try {
      const db = conn.connection.db;
      const collections = await db.listCollections({ name: 'peopsos' }).toArray();
      if (collections.length > 0) {
        const peoPsoCol = db.collection('peopsos');
        const indexes = await peoPsoCol.indexes();
        if (indexes.some(idx => idx.name === 'departmentId_1')) {
          await peoPsoCol.dropIndex('departmentId_1');
          console.log('[Database] Successfully dropped legacy unique index departmentId_1 from peopsos collection.');
        }
      }
    } catch (indexErr) {
      console.warn('[Database Warning] Failed to inspect/drop legacy index:', indexErr.message);
    }
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    console.warn('[Database Warning] Make sure MongoDB is running locally or set MONGO_URI in a .env file.');
    // In production, we'd exit. In development/testing, we can log and allow server to start so mock responses can work if needed.
    process.exit(1);
  }
};
