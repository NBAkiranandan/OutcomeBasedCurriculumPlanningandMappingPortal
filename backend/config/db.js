import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/obcpmp?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.6.0';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    console.warn('[Database Warning] Make sure MongoDB is running locally or set MONGO_URI in a .env file.');
    // In production, we'd exit. In development/testing, we can log and allow server to start so mock responses can work if needed.
    process.exit(1);
  }
};
